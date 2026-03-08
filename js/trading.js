/**
 * trading.js
 * Main entry point for the trading terminal.
 */

import { checkAuth } from './auth.js';
import { listenToMarket, updateMarketData } from './database.js';
import { MarketEngine } from './market-engine.js';
import { ChartSystem } from './chart-system.js';
import { OrderSystem } from './order-system.js';
import { PortfolioSystem } from './portfolio-system.js';

class TradingDashboard {
    constructor() {
        this.engine = new MarketEngine();
        this.chart = new ChartSystem('tradingChart');
        this.orders = null;
        this.portfolio = null;
        this.user = null;
        this.lastHistoryUpdate = 0;
        this.currentView = 'buy'; // 'buy' or 'sell'
        
        this.init();
    }

    async init() {
        checkAuth(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            this.user = user;
            this.orders = new OrderSystem(user.uid);
            this.portfolio = new PortfolioSystem(user.uid);

            await this.portfolio.load();
            this.setupEventListeners();
            this.listenToMarket();
            this.listenToOrders();
        });
    }

    setupEventListeners() {
        // Buy/Sell tabs
        document.getElementById('tab-buy').onclick = () => this.switchView('buy');
        document.getElementById('tab-sell').onclick = () => this.switchView('sell');

        // Order types (Market/Limit)
        document.querySelectorAll('input[name="orderType"]').forEach(radio => {
            radio.onchange = (e) => {
                const isLimit = e.target.value === 'limit';
                document.getElementById('limit-price-group').classList.toggle('hidden', !isLimit);
                document.getElementById('btn-execute').textContent = `EXECUTE ${this.currentView.toUpperCase()}${isLimit ? ' LIMIT' : ''}`;
            };
        });

        // Execute button
        document.getElementById('btn-execute').onclick = () => this.placeOrder();

        // Chart controls
        document.getElementById('btn-line').onclick = (e) => {
            this.chart.setMode('line');
            e.target.classList.add('active');
            document.getElementById('btn-candle').classList.remove('active');
        };

        // Tab Small (History/Open Orders)
        document.getElementById('tab-history').onclick = () => this.switchHistoryTab('history');
        document.getElementById('tab-open-orders').onclick = () => this.switchHistoryTab('orders');

        // Amount input listener for total
        document.getElementById('order-amount').addEventListener('input', () => this.updateOrderTotal());
        document.getElementById('limit-price').addEventListener('input', () => this.updateOrderTotal());
    }

    listenToMarket() {
        listenToMarket(async (marketData) => {
            this.engine.sync(marketData);
            
            // Render first time or update
            if (this.engine.history.length > 0) {
                if (!this.chart.chart) {
                    this.chart.initialize(this.engine.history);
                } else {
                    this.chart.update(this.engine.history);
                }
            }

            this.updateUI();

            // Market Maker Logic (One user updates the price if old)
            const now = Date.now();
            if (now - this.engine.lastUpdateTime > 3000) { // Update every 3 seconds
                const nextPrice = this.engine.calculateNextPrice();
                const nextHistory = [...this.engine.history, nextPrice].slice(-200);
                
                await updateMarketData(nextPrice, nextHistory, {
                    trend: this.engine.trend,
                    momentum: this.engine.momentum,
                    volatility: this.engine.volatility
                });

                // Check limit orders against new price
                await this.orders.checkLimitOrders(nextPrice, async (order, price) => {
                    await this.portfolio.load(); // Refresh
                    this.showFeedback(`Limit Order Executed: ${order.type} ${order.amount} at ${price.toFixed(2)}`, 'success');
                });
            }
        });
    }

    listenToOrders() {
        this.orders.listenToOrders(
            (openOrders) => this.renderOpenOrders(openOrders),
            (history) => this.renderHistory(history)
        );
    }

    switchView(view) {
        this.currentView = view;
        document.getElementById('tab-buy').classList.toggle('active', view === 'buy');
        document.getElementById('tab-sell').classList.toggle('active', view === 'sell');
        
        const btn = document.getElementById('btn-execute');
        const isLimit = document.querySelector('input[name="orderType"]:checked').value === 'limit';
        btn.textContent = `EXECUTE ${view.toUpperCase()}${isLimit ? ' LIMIT' : ''}`;
        btn.className = `btn btn-${view}`;
        
        this.updateOrderTotal();
    }

    switchHistoryTab(tab) {
        document.getElementById('tab-history').classList.toggle('active', tab === 'history');
        document.getElementById('tab-open-orders').classList.toggle('active', tab === 'orders');
        document.getElementById('trade-list').classList.toggle('hidden', tab !== 'history');
        document.getElementById('open-orders-list').classList.toggle('hidden', tab !== 'orders');
    }

    updateUI() {
        const price = this.engine.currentPrice;
        const prevPrice = this.engine.history[this.engine.history.length - 2] || price;
        const change = ((price - prevPrice) / prevPrice) * 100;

        const priceEl = document.getElementById('market-price');
        priceEl.textContent = price.toFixed(2);
        priceEl.className = `value ${price >= prevPrice ? 'up' : 'down'}`;

        const changeEl = document.getElementById('market-change');
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `value ${change >= 0 ? 'up' : 'down'}`;

        const trendEl = document.getElementById('market-trend');
        const trends = { '-1': 'CRASH', '-0.5': 'BEAR', '0': 'STABLE', '0.5': 'BULL', '1': 'MOON' };
        trendEl.textContent = trends[this.engine.trend.toString()] || 'STABLE';
        trendEl.className = `value ${this.engine.trend > 0 ? 'up' : (this.engine.trend < 0 ? 'down' : '')}`;

        // Portfolio
        if (this.portfolio) {
            const stats = this.portfolio.calculatePnL(price);
            document.getElementById('player-carrots').textContent = Math.floor(this.portfolio.carrots).toLocaleString();
            document.getElementById('portfolio-shares').textContent = this.portfolio.shares.toLocaleString();
            document.getElementById('portfolio-avg-price').textContent = this.portfolio.avgPrice.toFixed(2);
            document.getElementById('portfolio-value').textContent = Math.floor(stats.currentValue).toLocaleString();
            
            const plEl = document.getElementById('portfolio-pl');
            plEl.textContent = `${stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}%`;
            plEl.style.color = stats.profitLoss >= 0 ? 'var(--neon-green)' : 'var(--neon-pink)';
        }
    }

    updateOrderTotal() {
        const amount = parseFloat(document.getElementById('order-amount').value) || 0;
        const isLimit = document.querySelector('input[name="orderType"]:checked').value === 'limit';
        const price = isLimit ? (parseFloat(document.getElementById('limit-price').value) || 0) : this.engine.currentPrice;
        
        const total = amount * price;
        document.getElementById('order-total').textContent = Math.floor(total).toLocaleString();
    }

    async placeOrder() {
        const amount = parseInt(document.getElementById('order-amount').value);
        if (isNaN(amount) || amount <= 0) return this.showFeedback("Invalid amount", "error");

        const isLimit = document.querySelector('input[name="orderType"]:checked').value === 'limit';
        const limitPrice = parseFloat(document.getElementById('limit-price').value);
        
        if (isLimit && (isNaN(limitPrice) || limitPrice <= 0)) return this.showFeedback("Invalid limit price", "error");

        const price = isLimit ? limitPrice : this.engine.currentPrice;

        try {
            if (!isLimit) {
                // Market Order: Update Portfolio immediately
                await this.portfolio.processTrade(this.currentView, amount, price);
                await this.orders.placeOrder(this.currentView, amount, price, false);
                
                // Liquidity Impact
                this.engine.applyTradeImpact(this.currentView === 'buy' ? amount : -amount);
                await updateMarketData(this.engine.currentPrice, this.engine.history, {
                    momentum: this.engine.momentum
                });

                this.showFeedback(`${this.currentView === 'buy' ? 'Bought' : 'Sold'} ${amount} shares!`, "success");
            } else {
                // Limit Order: just save to orders
                await this.orders.placeOrder(this.currentView, amount, price, true);
                this.showFeedback(`Limit ${this.currentView} order placed!`, "success");
            }
            
            this.updateUI();
        } catch (e) {
            this.showFeedback(e.message, "error");
        }
    }

    showFeedback(msg, type) {
        const el = document.getElementById('order-feedback');
        el.textContent = msg;
        el.style.color = type === "success" ? "var(--neon-green)" : "var(--neon-pink)";
        setTimeout(() => el.textContent = "", 4000);
    }

    renderHistory(history) {
        const body = document.getElementById('trade-history-body');
        body.innerHTML = history.map(t => `
            <tr>
                <td class="${t.type === 'buy' ? 'up' : 'down'}">${t.type.toUpperCase()}</td>
                <td>${t.price.toFixed(2)}</td>
                <td>${t.amount}</td>
                <td>${new Date(t.timestamp?.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
        `).join('');
    }

    renderOpenOrders(orders) {
        const body = document.getElementById('open-orders-body');
        body.innerHTML = orders.map(o => `
            <tr>
                <td class="${o.type === 'buy' ? 'up' : 'down'}">${o.type.toUpperCase()}</td>
                <td>${o.price.toFixed(2)}</td>
                <td>${o.amount}</td>
                <td><button class="btn-small" onclick="window.cancelOrder('${o.id}')">Cancel</button></td>
            </tr>
        `).join('');
    }
}

// Global accessor for cancel button
const dashboard = new TradingDashboard();
window.cancelOrder = (id) => dashboard.orders.cancelOrder(id);
