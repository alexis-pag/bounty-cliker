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
        this.reservedCarrots = 0;
        this.reservedShares = 0;
    }

    async load() {
        const data = await loadUserData(this.userId);
        if (data) {
            this.shares = Number(data.portfolio?.shares) || 0;
            this.avgPrice = Number(data.portfolio?.averageBuyPrice) || 0;
            this.totalInvested = Number(data.portfolio?.totalInvested) || 0;
            this.reservedCarrots = Number(data.portfolio?.reservedCarrots) || 0;
            this.reservedShares = Number(data.portfolio?.reservedShares) || 0;
            this.carrots = Number(data.gameData?.count) || 0;
            console.log("Portfolio Loaded:", { shares: this.shares, carrots: this.carrots, reserved: { carrots: this.reservedCarrots, shares: this.reservedShares } });
        }
    }

    /**
     * Reserve funds for a limit buy order
     */
    async reserveCarrots(amountInCarrots) {
        const cost = Math.floor(amountInCarrots);
        if (this.carrots < cost) throw new Error("Not enough carrots to reserve");
        
        this.carrots -= cost;
        this.reservedCarrots += cost;
        
        await updatePlayerPortfolio(this.userId, {
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares,
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested
        }, -cost);
    }

    /**
     * Unreserve funds (if order canceled)
     */
    async unreserveCarrots(amountInCarrots) {
        const cost = Math.floor(amountInCarrots);
        this.carrots += cost;
        this.reservedCarrots = Math.max(0, this.reservedCarrots - cost);
        
        await updatePlayerPortfolio(this.userId, {
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares,
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested
        }, cost);
    }

    /**
     * Reserve shares for a limit sell order
     */
    async reserveShares(amountInShares) {
        if (this.shares < amountInShares) throw new Error("Not enough shares to reserve");
        
        this.shares -= amountInShares;
        this.reservedShares += amountInShares;
        
        await updatePlayerPortfolio(this.userId, {
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares,
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested
        }, 0);
    }

    /**
     * Unreserve shares (if order canceled)
     */
    async unreserveShares(amountInShares) {
        this.shares += amountInShares;
        this.reservedShares = Math.max(0, this.reservedShares - amountInShares);
        
        await updatePlayerPortfolio(this.userId, {
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares,
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested
        }, 0);
    }

    /**
     * Update portfolio after a trade
     */
    async processTrade(type, amount, price, fromReserved = false) {
        const cost = Math.floor(amount * price);
        console.log(`Processing ${type}: amount=${amount}, price=${price}, totalCost=${cost}, fromReserved=${fromReserved}`);
        
        let countChange = 0;

        if (type === 'buy') {
            if (fromReserved) {
                // Find how much was reserved for this specific amount
                // In this system, we reserve exactly amount * orderPrice
                // If executed at currentPrice (which is <= orderPrice), we refund the difference
                const reservedForThis = cost; // For now, we assume cost passed is what was reserved
                this.reservedCarrots = Math.max(0, this.reservedCarrots - reservedForThis);
                
                // If we want to support better-than-limit execution:
                // const actualCost = Math.floor(amount * actualPrice);
                // const refund = reservedForThis - actualCost;
                // this.carrots += refund;
            } else {
                if (this.carrots < cost) throw new Error("Not enough carrots");
                this.carrots -= cost;
                countChange = -cost;
            }
            
            const newShares = this.shares + amount;
            const newAvg = ((this.avgPrice * this.shares) + cost) / newShares;
            
            this.shares = newShares;
            this.avgPrice = newAvg;
            this.totalInvested += cost;
        } else {
            if (fromReserved) {
                // Shares were already deducted and put in reservedShares
                this.reservedShares = Math.max(0, this.reservedShares - amount);
            } else {
                if (this.shares < amount) throw new Error("Not enough shares");
                this.shares -= amount;
            }
            
            this.carrots += cost;
            countChange = cost;
            
            if (this.shares === 0 && this.reservedShares === 0) {
                this.avgPrice = 0;
                this.totalInvested = 0;
            } else if (this.shares > 0) {
                this.totalInvested -= (this.avgPrice * amount);
            }
        }

        const updates = {
            shares: this.shares,
            averageBuyPrice: this.avgPrice,
            totalInvested: this.totalInvested,
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares
        };

        await updatePlayerPortfolio(this.userId, updates, countChange);
        
        return {
            shares: this.shares,
            avgPrice: this.avgPrice,
            carrots: this.carrots,
            reservedCarrots: this.reservedCarrots,
            reservedShares: this.reservedShares
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
