/**
 * click-detection.js
 * Tracks click rates to detect potential auto-clickers.
 */

export class ClickDetection {
    constructor(threshold = 40, windowSizeMs = 1000) {
        this.threshold = threshold; 
        this.windowSizeMs = windowSizeMs; 
        this.clickTimestamps = [];
        this.clickLog = []; // {time, value, x, y, isTrusted}
        
        // Advanced detection parameters
        this.suspicionScore = 0;
        this.maxSuspicionScore = 200; // Trigger threshold
        this.decayRate = 0.5; // Points lost per second of normal play
        this.lastUpdateTime = Date.now();

        this.lastIntervals = [];
        this.maxIntervals = 20;
        this.lastPositions = [];
        this.maxPositions = 15;

        // Long-term consistency analysis
        this.cpsHistory = []; // [cps_at_t1, cps_at_t2, ...]
        this.maxCpsHistory = 15; // Analyze last 15 seconds
    }

    /**
     * Records a click and performs multi-stage analysis
     */
    recordClick(value = 0, event = null) {
        const now = Date.now();
        this.decaySuspicion(now);

        const clickData = { 
            time: now, 
            value: value,
            x: event ? event.clientX : -1,
            y: event ? event.clientY : -1,
            isTrusted: event ? event.isTrusted : true
        };

        this.clickTimestamps.push(now);
        this.clickLog.push(clickData);
        
        // 1. Immediate Trust Check
        if (clickData.isTrusted === false) this.suspicionScore += 80;

        // 2. Short-term Interval Analysis (Variance)
        this.analyzeIntervals(now);

        // 3. Position Analysis (Static clicking)
        this.analyzePositions(clickData);

        // 4. CPS Burst Check
        const currentCps = this.calculateCPS();
        if (currentCps > 55) this.suspicionScore += 40;
        else if (currentCps >= this.threshold) this.suspicionScore += 5;

        // 5. Long-term Consistency Check (Run every ~1s)
        this.analyzeConsistency(now, currentCps);

        this.cleanOldTimestamps(now);
        this.cleanOldLog(now);
        
        return currentCps;
    }

    decaySuspicion(now) {
        const elapsed = (now - this.lastUpdateTime) / 1000;
        if (elapsed > 0.5) {
            // Natural decay of suspicion points over time
            this.suspicionScore = Math.max(0, this.suspicionScore - (this.decayRate * elapsed));
            this.lastUpdateTime = now;
        }
    }

    analyzeIntervals(now) {
        if (this.clickTimestamps.length < 2) return;
        
        const lastTs = this.clickTimestamps[this.clickTimestamps.length - 2];
        const interval = now - lastTs;
        
        this.lastIntervals.push(interval);
        if (this.lastIntervals.length > this.maxIntervals) this.lastIntervals.shift();

        // 1. Detection of exact same intervals (e.g., always 100ms)
        if (this.lastIntervals.length >= 5) {
            const lastFive = this.lastIntervals.slice(-5);
            const identical = lastFive.every(val => val === lastFive[0]);
            if (identical && lastFive[0] > 0) {
                this.suspicionScore += 35; // Very high suspicion for perfect timing
            }
        }

        // 2. Detection of perfectly rounded intervals (multiple of 10ms or exactly 100, 50, etc.)
        if (interval > 0 && interval % 50 === 0) {
            this.suspicionScore += 5; // Humans rarely hit exact multiples of 50ms
        }

        // 3. Statistical Variance Analysis
        if (this.lastIntervals.length >= 12) {
            const avg = this.lastIntervals.reduce((a, b) => a + b) / this.lastIntervals.length;
            const variance = this.lastIntervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / this.lastIntervals.length;
            
            // Auto-clickers: ultra-low variance (consistency is inhuman)
            if (variance < 0.8) this.suspicionScore += 12;
            else if (variance < 2.5) this.suspicionScore += 4;
            // Humans have jitter, high variance reduces suspicion
            else if (variance > 15) this.suspicionScore = Math.max(0, this.suspicionScore - 1);
        }
    }

    analyzePositions(clickData) {
        if (clickData.x === -1) return;

        this.lastPositions.push({x: clickData.x, y: clickData.y});
        if (this.lastPositions.length > this.maxPositions) this.lastPositions.shift();

        if (this.lastPositions.length >= 8) {
            const first = this.lastPositions[0];
            const allSame = this.lastPositions.every(p => p.x === first.x && p.y === first.y);
            // Clicking the EXACT same pixel 8 times at high speed is rare for humans
            if (allSame && this.calculateCPS() > 15) {
                this.suspicionScore += 8;
            }
        }
    }

    analyzeConsistency(now, currentCps) {
        // Only record every ~1 second
        if (this.cpsHistory.length === 0 || now - this.cpsHistory[this.cpsHistory.length - 1].t >= 1000) {
            this.cpsHistory.push({t: now, cps: currentCps});
            if (this.cpsHistory.length > this.maxCpsHistory) this.cpsHistory.shift();

            if (this.cpsHistory.length >= 10) {
                const values = this.cpsHistory.map(h => h.cps);
                const avg = values.reduce((a, b) => a + b) / values.length;
                
                // If average CPS is high (>25) AND varies very little (inhuman stamina)
                const dev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
                
                if (avg > 30 && dev < 1.5) {
                    this.suspicionScore += 25; // Superhuman stamina detected
                }
            }
        }
    }

    cleanOldTimestamps(now) {
        const cutoff = now - this.windowSizeMs;
        while (this.clickTimestamps.length > 0 && this.clickTimestamps[0] < cutoff) {
            this.clickTimestamps.shift();
        }
    }

    cleanOldLog(now) {
        const cutoff = now - 20000; // Keep 20s for long-term analysis
        while (this.clickLog.length > 0 && this.clickLog[0].time < cutoff) {
            this.clickLog.shift();
        }
    }

    getInvalidRewards() {
        // If trigger is reached, return rewards from the last 5 seconds of suspicious activity
        if (this.suspicionScore < this.maxSuspicionScore) return 0;
        
        const cutoff = Date.now() - 5000;
        return this.clickLog
            .filter(c => c.time >= cutoff)
            .reduce((sum, c) => sum + c.value, 0);
    }

    calculateCPS() {
        const now = Date.now();
        const cutoff = now - this.windowSizeMs;
        return this.clickTimestamps.filter(t => t >= cutoff).length;
    }

    detectAutoClick() {
        // The trigger is now based on a composite score rather than immediate CPS
        return this.suspicionScore >= this.maxSuspicionScore;
    }

    reset() {
        this.clickTimestamps = [];
        this.clickLog = [];
        this.suspicionScore = 0;
        this.lastIntervals = [];
        this.lastPositions = [];
        this.cpsHistory = [];
        this.lastUpdateTime = Date.now();
    }
}
