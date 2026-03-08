/**
 * portfolio-system.js
 * Manages the player's trading portfolio.
 */

import { updatePlayerPortfolio, loadUserData } from './database.js';

export class PortfolioSystem {
    constructor(userId) {
        this.userId = userId;
        this.shares = 0;
        this.avgPrice = 0;
        this.totalInvested = 0;
        this.carrots = 0;
    }

    async load() {
        const data = await loadUserData(this.userId);
        if (data) {
            this.shares = Number(data.portfolio?.shares) || 0;
            this.avgPrice = Number(data.portfolio?.averageBuyPrice) || 0;
            this.totalInvested = Number(data.portfolio?.totalInvested) || 0;
            this.carrots = Number(data.gameData?.count) || 0;
            console.log("Portfolio Loaded:", { shares: this.shares, carrots: this.carrots });
        }
    }

    /**
     * Update portfolio after a trade
     */
    async processTrade(type, amount, price) {
        const cost = amount * price;
        console.log(`Processing ${type}: amount=${amount}, price=${price}, totalCost=${cost}`);
        
        if (type === 'buy') {
            if (this.carrots < cost) {
                console.error("Not enough carrots:", { wallet: this.carrots, cost });
                throw new Error("Not enough carrots");
            }
            
            const newShares = this.shares + amount;
            const newAvg = ((this.avgPrice * this.shares) + cost) / newShares;
            
            this.shares = newShares;
            this.avgPrice = newAvg;
            this.totalInvested += cost;
            this.carrots -= cost;
        } else {
            if (this.shares < amount) throw new Error("Not enough shares");
            
            const gain = cost;
            this.shares -= amount;
            // Realized profit could be tracked here
            this.carrots += gain;
            
            if (this.shares === 0) {
                this.avgPrice = 0;
                this.totalInvested = 0;
            } else {
                // Keep the same average purchase price for remaining shares
                this.totalInvested -= (this.avgPrice * amount);
            }
        }

        const updates = {
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested
        };

        // Sync to Firebase
        // updatePlayerPortfolio(uid, portfolioUpdates, countChange)
        // Note: cost is already deducted/added locally above, so we pass difference to update count
        const change = type === 'buy' ? -cost : cost;
        await updatePlayerPortfolio(this.userId, updates, change);
        
        return {
            shares: this.shares,
            avgPrice: this.avgPrice,
            carrots: this.carrots
        };
    }

    calculatePnL(currentPrice) {
        const currentValue = this.shares * currentPrice;
        const profitLoss = this.avgPrice > 0 ? ((currentPrice - this.avgPrice) / this.avgPrice * 100) : 0;
        return {
            currentValue,
            profitLoss
        };
    }
}
