/**
 * click-detection.js
 * Tracks click rates to detect potential auto-clickers.
 */

export class ClickDetection {
    constructor(threshold = 30, windowSizeMs = 1000) {
        this.threshold = threshold; 
        this.windowSizeMs = windowSizeMs; 
        this.clickTimestamps = [];
        this.clickLog = []; // {time, value, x, y, isTrusted}
        this.sustainedHighCPSStart = null;
        this.sustainedDurationMs = 2500; // Increased to be more forgiving
        
        // Advanced detection parameters
        this.maxSuspicionPoints = 120; // Increased
        this.suspicionPoints = 0;
        this.lastIntervals = [];
        this.maxIntervals = 15;
        this.lastPositions = [];
        this.maxPositions = 10;
    }

    /**
     * Records a click event with the current timestamp and value.
     */
    recordClick(value = 0, event = null) {
        const now = Date.now();
        const clickData = { 
            time: now, 
            value: value,
            x: event ? event.clientX : -1,
            y: event ? event.clientY : -1,
            isTrusted: event ? event.isTrusted : true
        };

        this.clickTimestamps.push(now);
        this.clickLog.push(clickData);
        
        this.analyzeIntervals(now);
        this.analyzePositions(clickData);
        this.analyzeTrust(clickData);

        this.cleanOldTimestamps(now);
        this.cleanOldLog(now);
        
        return this.calculateCPS();
    }

    analyzeIntervals(now) {
        if (this.clickTimestamps.length < 2) return;
        
        const lastTs = this.clickTimestamps[this.clickTimestamps.length - 2];
        const interval = now - lastTs;
        
        this.lastIntervals.push(interval);
        if (this.lastIntervals.length > this.maxIntervals) {
            this.lastIntervals.shift();
        }

        if (this.lastIntervals.length >= 10) {
            const avg = this.lastIntervals.reduce((a, b) => a + b) / this.lastIntervals.length;
            const variance = this.lastIntervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / this.lastIntervals.length;
            
            // Human clicks have variance. Auto-clickers often have < 2ms variance
            if (variance < 1.5) {
                this.suspicionPoints += 15;
            } else if (variance < 3.0) {
                this.suspicionPoints += 5;
            } else {
                this.suspicionPoints = Math.max(0, this.suspicionPoints - 2);
            }
        }
    }

    analyzePositions(clickData) {
        if (clickData.x === -1) return; // Not a real event

        this.lastPositions.push({x: clickData.x, y: clickData.y});
        if (this.lastPositions.length > this.maxPositions) {
            this.lastPositions.shift();
        }

        if (this.lastPositions.length >= 5) {
            const first = this.lastPositions[0];
            const allSame = this.lastPositions.every(p => p.x === first.x && p.y === first.y);
            
            // Clicking exactly same pixel 5 times in a row is very suspicious for a fast clicker
            if (allSame) {
                this.suspicionPoints += 10;
            }
        }
    }

    analyzeTrust(clickData) {
        if (clickData.isTrusted === false) {
            this.suspicionPoints += 50; // Immediate huge suspicion
        }
    }

    cleanOldTimestamps(now = Date.now()) {
        const cutoff = now - this.windowSizeMs;
        while (this.clickTimestamps.length > 0 && this.clickTimestamps[0] < cutoff) {
            this.clickTimestamps.shift();
        }
    }

    cleanOldLog(now = Date.now()) {
        const cutoff = now - 10000;
        while (this.clickLog.length > 0 && this.clickLog[0].time < cutoff) {
            this.clickLog.shift();
        }
    }

    getInvalidRewards() {
        if (!this.sustainedHighCPSStart && this.suspicionPoints < this.maxSuspicionPoints) return 0;
        
        const start = this.sustainedHighCPSStart || (this.clickLog.length > 0 ? this.clickLog[0].time : Date.now());
        return this.clickLog
            .filter(c => c.time >= start)
            .reduce((sum, c) => sum + c.value, 0);
    }

    calculateCPS() {
        this.cleanOldTimestamps();
        return this.clickTimestamps.length;
    }

    detectAutoClick() {
        const cps = this.calculateCPS();
        const now = Date.now();

        // Check 1: Excessive CPS
        if (cps >= this.threshold) {
            if (!this.sustainedHighCPSStart) this.sustainedHighCPSStart = now;
            if (now - this.sustainedHighCPSStart >= this.sustainedDurationMs) {
                return true;
            }
        } else {
            this.sustainedHighCPSStart = null;
        }

        // Check 2: Behavior Analysis (Suspicion Points)
        if (this.suspicionPoints >= this.maxSuspicionPoints) {
            return true;
        }

        // Check 3: Impossible Bursts
        if (cps > 45) return true; // Absolutely impossible for human sustained

        return false;
    }

    reset() {
        this.clickTimestamps = [];
        this.clickLog = [];
        this.sustainedHighCPSStart = null;
        this.suspicionPoints = 0;
        this.lastIntervals = [];
        this.lastPositions = [];
    }
}
