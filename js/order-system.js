/**
 * order-system.js
 * Manages market and limit orders.
 */

import { db } from './database.js';
import { 
    collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, 
    onSnapshot, orderBy, limit, setDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export class OrderSystem {
    constructor(userId) {
        this.userId = userId;
        this.openOrders = [];
        this.recentTrades = [];
    }

    /**
     * Listen to user's open orders and general recent trades
     */
    listenToOrders(onOpenOrdersUpdate, onHistoryUpdate) {
        // User's limit orders
        const qOpen = query(
            collection(db, "orders"),
            where("userId", "==", this.userId),
            where("status", "==", "open"),
            orderBy("timestamp", "desc")
        );

        onSnapshot(qOpen, (snap) => {
            this.openOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            onOpenOrdersUpdate(this.openOrders);
        });

        // Global trade history
        const qHistory = query(
            collection(db, "trades"),
            orderBy("timestamp", "desc"),
            limit(20)
        );

        onSnapshot(qHistory, (snap) => {
            this.recentTrades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            onHistoryUpdate(this.recentTrades);
        });
    }

    /**
     * Place a new order
     */
    async placeOrder(type, amount, price, isLimit = false) {
        const orderData = {
            userId: this.userId,
            type: type, // 'buy' or 'sell'
            amount: amount,
            price: price,
            isLimit: isLimit,
            status: isLimit ? "open" : "executed",
            timestamp: serverTimestamp()
        };

        if (!isLimit) {
            // Market orders are executed immediately
            // In a real system, we'd use a transaction here
            await addDoc(collection(db, "trades"), orderData);
            return { success: true, orderId: null };
        } else {
            const docRef = await addDoc(collection(db, "orders"), orderData);
            return { success: true, orderId: docRef.id };
        }
    }

    /**
     * Check and execute limit orders against current market price
     */
    async checkLimitOrders(currentPrice, portfolio, onExecute) {
        // Find orders that meet price criteria
        // Buys: target price >= current price
        // Sells: target price <= current price
        
        const qBuy = query(
            collection(db, "orders"),
            where("userId", "==", this.userId),
            where("status", "==", "open"),
            where("type", "==", "buy"),
            where("price", ">=", currentPrice)
        );

        const qSell = query(
            collection(db, "orders"),
            where("userId", "==", this.userId),
            where("status", "==", "open"),
            where("type", "==", "sell"),
            where("price", "<=", currentPrice)
        );

        const [buySnap, sellSnap] = await Promise.all([getDocs(qBuy), getDocs(qSell)]);
        
        const ordersToExecute = [...buySnap.docs, ...sellSnap.docs];
        
        if (ordersToExecute.length === 0) return;

        for (const orderDoc of ordersToExecute) {
            const order = orderDoc.data();
            const orderId = orderDoc.id;

            try {
                // Execute on portfolio
                await portfolio.processTrade(order.type, order.amount, order.price, true);

                const batch = writeBatch(db);
                
                // Mark as executed
                batch.update(orderDoc.ref, { status: "executed" });
                
                // Add to trade history
                const tradeRef = doc(collection(db, "trades"));
                batch.set(tradeRef, {
                    ...order,
                    executedPrice: currentPrice,
                    status: "executed",
                    timestamp: serverTimestamp()
                });

                await batch.commit();
                if (onExecute) onExecute(order, currentPrice);
            } catch (e) {
                console.error("Failed to execute limit order:", orderId, e);
            }
        }
    }

    async cancelOrder(orderId, portfolio) {
        // We need to get the order first to know what to unreserve
        const orderRef = doc(db, "orders", orderId);
        const snap = await getDocs(query(collection(db, "orders"), where("__name__", "==", orderId)));
        
        if (!snap.empty) {
            const order = snap.docs[0].data();
            if (order.status === 'open') {
                if (order.type === 'buy') {
                    await portfolio.unreserveCarrots(order.amount * order.price);
                } else {
                    await portfolio.unreserveShares(order.amount);
                }
            }
        }
        await deleteDoc(orderRef);
    }
}
