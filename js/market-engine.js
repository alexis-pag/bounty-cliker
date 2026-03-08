/**
 * market-engine.js
 * Handles the realistic market simulation logic.
 */

export class MarketEngine {
    constructor() {
        this.currentPrice = 100;
        this.history = [];
        this.volatility = 0.005; // 0.5% base fluctuation
        this.trend = 0; // -1 to 1 (bear to bull)
        this.momentum = 0;
        this.trendDuration = 0;
        this.lastUpdateTime = 0;
    }

    /**
     * Synchronize local engine state with Firebase data
     */
    sync(marketData) {
        if (!marketData) return;
        this.currentPrice = marketData.currentPrice || 100;
        this.history = marketData.history || [];
        this.volatility = marketData.volatility || 0.005;
        this.trend = marketData.trend || 0;
        this.momentum = marketData.momentum || 0;
        this.lastUpdateTime = marketData.lastUpdate?.toMillis() || 0;
    }

    /**
     * Generate the next price point based on trends and random walk
     */
    calculateNextPrice() {
        // Update trend if duration expired
        if (this.trendDuration <= 0) {
            this.generateNewTrend();
        }
        this.trendDuration--;

        // Random walk component
        const randomShock = (Math.random() - 0.5) * 2 * this.volatility;
        
        // Trend influence
        const trendInfluence = this.trend * (this.volatility * 0.5);
        
        // Momentum influence (price movement persistence)
        const momentumInfluence = this.momentum * 0.1;

        // Calculate change percentage
        const changePercent = randomShock + trendInfluence + momentumInfluence;
        
        // Apply change
        let newPrice = this.currentPrice * (1 + changePercent);

        // Rare events (5-15%)
        const eventRoll = Math.random();
        if (eventRoll < 0.005) { // 0.5% chance of crash
            newPrice *= (0.85 + Math.random() * 0.1);
            this.trend = -0.8;
            this.momentum = -0.5;
        } else if (eventRoll > 0.995) { // 0.5% chance of mooning
            newPrice *= (1.05 + Math.random() * 0.1);
            this.trend = 0.8;
            this.momentum = 0.5;
        }

        // Constraints
        newPrice = Math.max(1, newPrice);
        
        // Update momentum for next calculation
        this.momentum = (newPrice - this.currentPrice) / this.currentPrice;
        this.currentPrice = newPrice;

        return this.currentPrice;
    }

    generateNewTrend() {
        // -1 (Strong Bear), -0.5 (Weak Bear), 0 (Sideways), 0.5 (Weak Bull), 1 (Strong Bull)
        const trends = [-1, -0.5, 0, 0, 0.5, 1];
        this.trend = trends[Math.floor(Math.random() * trends.length)];
        this.trendDuration = 10 + Math.floor(Math.random() * 20); // 10-30 ticks
    }

    /**
     * Apply price impact from large trades (Liquidity simulation)
     * @param {number} amount Number of shares traded (positive for buy, negative for sell)
     * @param {number} totalLiquidity Arbitrary constant representing market depth
     */
    applyTradeImpact(amount, totalLiquidity = 100000) {
        const impact = (amount / totalLiquidity);
        this.currentPrice *= (1 + impact);
        this.momentum += impact;
        return this.currentPrice;
    }

    getMarketState() {
        return {
            currentPrice: this.currentPrice,
            volatility: this.volatility,
            trend: this.trend,
            momentum: this.momentum,
            history: this.history
        };
    }
}
