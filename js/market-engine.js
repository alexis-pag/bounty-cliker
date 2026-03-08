/**
 * market-engine.js
 * Handles the realistic market simulation logic.
 */

export class MarketEngine {
    constructor() {
        this.currentPrice = 100;
        this.history = [];
        this.volatility = 0.002; // Reduced fluctuation for slower curve
        this.trend = 0; // -1 to 1 (bear to bull)
        this.momentum = 0;
        this.trendDuration = 0;
        this.lastUpdateTime = 0;
        this.currentNews = null;
    }

    /**
     * Synchronize local engine state with Firebase data
     */
    sync(marketData) {
        if (!marketData) return;
        this.currentPrice = Number(marketData.currentPrice) || 100;
        this.history = Array.isArray(marketData.history) ? marketData.history : [];
        this.volatility = Number(marketData.volatility) || 0.002;
        this.trend = Number(marketData.trend) || 0;
        this.momentum = Number(marketData.momentum) || 0;
        this.trendDuration = Number(marketData.trendDuration) || 0;
        this.lastUpdateTime = marketData.lastUpdate?.toMillis() || 0;
        this.currentNews = marketData.currentNews || null;

        // Validation to prevent NaN propagation
        if (isNaN(this.currentPrice)) this.currentPrice = 100;
        if (isNaN(this.volatility)) this.volatility = 0.002;
        if (isNaN(this.trend)) this.trend = 0;
        if (isNaN(this.momentum)) this.momentum = 0;
        if (isNaN(this.trendDuration)) this.trendDuration = 0;
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

        // News influence
        let newsMultiplier = 1.0;
        if (this.currentNews) {
            newsMultiplier = this.currentNews.impact;
        }

        // Random walk component
        const randomShock = (Math.random() - 0.5) * 2 * this.volatility;
        
        // Trend influence
        const trendInfluence = this.trend * (this.volatility * 0.5);
        
        // Momentum influence (price movement persistence)
        const momentumInfluence = this.momentum * 0.1;

        // Calculate change percentage
        let changePercent = (randomShock + trendInfluence + momentumInfluence) * newsMultiplier;
        
        // Apply change
        let newPrice = this.currentPrice * (1 + changePercent);

        // Rare events (5-15%)
        const eventRoll = Math.random();
        if (eventRoll < 0.005) { // 0.5% chance of crash
            newPrice *= (0.85 + Math.random() * 0.1);
            this.trend = -0.8;
            this.momentum = -0.5;
            this.currentNews = { title: "MARKET CRASH!", impact: 1.5, type: 'negative' };
        } else if (eventRoll > 0.995) { // 0.5% chance of mooning
            newPrice *= (1.05 + Math.random() * 0.1);
            this.trend = 0.8;
            this.momentum = 0.5;
            this.currentNews = { title: "CARROT SHORTAGE!", impact: 1.5, type: 'positive' };
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

        // Chance to generate new news when trend changes
        if (Math.random() < 0.3) {
            this.generateNews();
        } else if (this.trendDuration < 5) {
            this.currentNews = null; // Clear news as trend ends
        }
    }

    generateNews() {
        const positiveNews = [
            { title: "Bounty finds a giant carrot!", impact: 1.2, type: 'positive' },
            { title: "New carrot health benefits discovered", impact: 1.15, type: 'positive' },
            { title: "Carrot festival boosts demand", impact: 1.1, type: 'positive' },
            { title: "Famous bunny endorses carrots", impact: 1.25, type: 'positive' }
        ];
        const negativeNews = [
            { title: "Carrot weevil infestation reported", impact: 0.8, type: 'negative' },
            { title: "Rabbits switching to cabbage?", impact: 0.85, type: 'negative' },
            { title: "Oversupply of carrots in market", impact: 0.9, type: 'negative' },
            { title: "Winter storm delays carrot harvest", impact: 0.75, type: 'negative' }
        ];

        if (this.trend > 0) {
            this.currentNews = positiveNews[Math.floor(Math.random() * positiveNews.length)];
        } else if (this.trend < 0) {
            this.currentNews = negativeNews[Math.floor(Math.random() * negativeNews.length)];
        } else {
            this.currentNews = { title: "Market is stabilizing", impact: 1.0, type: 'neutral' };
        }
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
            history: this.history,
            currentNews: this.currentNews
        };
    }
}
