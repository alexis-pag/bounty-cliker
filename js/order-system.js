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
    async checkLimitOrders(currentPrice, onExecute) {
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
            // Process execution (usually this should be a backend function or transaction)
            // For this game, we'll mark it as executed
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
            onExecute(order, currentPrice);
        }
    }

    async cancelOrder(orderId) {
        await deleteDoc(doc(db, "orders", orderId));
    }
}
