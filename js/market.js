/**
 * market.js
 * Main entry point for the carrot market terminal.
 */

import { checkAuth } from './auth.js';
import { listenToMarket, updateMarketData } from './database.js';
import { MarketEngine } from './market-engine.js';
import { ChartSystem } from './chart-system.js';
import { OrderSystem } from './order-system.js';
import { PortfolioSystem } from './portfolio-system.js';

class MarketDashboard {
    constructor() {
        this.engine = new MarketEngine();
        this.chart = new ChartSystem('tradingChart');
        this.orders = null;
        this.portfolio = null;
        this.user = null;
        this.currentView = 'buy';
        
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

            // Automatic Price Generation Loop (Master role)
            // One client updates the market if it's been more than 3 seconds
            const now = Date.now();
            if (now - this.engine.lastUpdateTime > 3000) {
                const nextPrice = this.engine.calculateNextPrice();
                const nextHistory = [...this.engine.history, nextPrice].slice(-200);
                
                await updateMarketData(nextPrice, nextHistory, {
                    trend: this.engine.trend,
                    momentum: this.engine.momentum,
                    volatility: this.engine.volatility
                });

                // Check limit orders
                await this.orders.checkLimitOrders(nextPrice, async (order, price) => {
                    await this.portfolio.load(); // Refresh local balance/shares
                    this.showFeedback(`Limit ${order.type.toUpperCase()} executed at ${price.toFixed(2)}`, 'success');
                });
            }
        });
    }

    listenToOrders() {
        this.orders.listenToOrders(
            (openOrders) => {}, // Logic can be added to show open orders in market.html if needed
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

    updateUI() {
        const price = this.engine.currentPrice;
        const prevPrice = this.engine.history[this.engine.history.length - 2] || price;
        const change = ((price - prevPrice) / prevPrice) * 100;

        document.getElementById('market-price').textContent = price.toFixed(2);
        document.getElementById('market-price').className = `value ${price >= prevPrice ? 'up' : 'down'}`;

        const changeEl = document.getElementById('market-change');
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `value ${change >= 0 ? 'up' : 'down'}`;

        const trendEl = document.getElementById('market-trend');
        const trends = { '-1': 'CRASH', '-0.5': 'BEAR', '0': 'STABLE', '0.5': 'BULL', '1': 'MOON' };
        trendEl.textContent = trends[this.engine.trend.toString()] || 'STABLE';
        trendEl.className = `value ${this.engine.trend > 0 ? 'up' : (this.engine.trend < 0 ? 'down' : '')}`;

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

        const view = document.getElementById('tab-buy').classList.contains('active') ? 'buy' : 'sell';
        const isLimit = document.querySelector('input[name="orderType"]:checked').value === 'limit';
        const price = isLimit ? parseFloat(document.getElementById('limit-price').value) : this.engine.currentPrice;

        try {
            if (!isLimit) {
                await this.portfolio.processTrade(view, amount, price);
                await this.orders.placeOrder(view, amount, price, false);
                this.engine.applyTradeImpact(view === 'buy' ? amount : -amount);
                await updateMarketData(this.engine.currentPrice, this.engine.history, {
                    momentum: this.engine.momentum
                });
                this.showFeedback(`${view === 'buy' ? 'Bought' : 'Sold'} ${amount} shares!`, "success");
            } else {
                await this.orders.placeOrder(view, amount, price, true);
                this.showFeedback(`Limit ${view} order placed!`, "success");
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
}

new MarketDashboard();
