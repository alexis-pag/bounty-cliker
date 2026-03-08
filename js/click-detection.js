/**
 * click-detection.js
 * Tracks click rates to detect potential auto-clickers.
 */

export class ClickDetection {
    constructor(threshold = 20, windowSizeMs = 1000) {
        this.threshold = threshold; // CPS threshold to trigger suspicion
        this.windowSizeMs = windowSizeMs; // Time window in milliseconds
        this.clickTimestamps = [];
        this.clickLog = []; // {time, value}
        this.sustainedHighCPSStart = null;
        this.sustainedDurationMs = 2000; // Time in ms high CPS must be maintained to trigger
    }

    /**
     * Records a click event with the current timestamp and value.
     * @returns {number} The current CPS (Clicks Per Second).
     */
    recordClick(value = 0) {
        const now = Date.now();
        this.clickTimestamps.push(now);
        this.clickLog.push({ time: now, value: value });
        this.cleanOldTimestamps(now);
        this.cleanOldLog(now);
        return this.calculateCPS();
    }

    /**
     * Removes timestamps outside the observation window.
     */
    cleanOldTimestamps(now = Date.now()) {
        const cutoff = now - this.windowSizeMs;
        while (this.clickTimestamps.length > 0 && this.clickTimestamps[0] < cutoff) {
            this.clickTimestamps.shift();
        }
    }

    /**
     * Removes log entries outside the long-term buffer (e.g., 10 seconds).
     */
    cleanOldLog(now = Date.now()) {
        const cutoff = now - 10000; // Keep 10s of history to detect bursts
        while (this.clickLog.length > 0 && this.clickLog[0].time < cutoff) {
            this.clickLog.shift();
        }
    }

    /**
     * Calculates total value of clicks in the log within the suspicion period.
     */
    getInvalidRewards() {
        if (!this.sustainedHighCPSStart) return 0;
        // Total value of all clicks since the burst started
        return this.clickLog
            .filter(c => c.time >= this.sustainedHighCPSStart)
            .reduce((sum, c) => sum + c.value, 0);
    }

    clearLog() {
        this.clickLog = [];
    }

    /**
     * Calculates current CPS based on the sliding window.
     */
    calculateCPS() {
        this.cleanOldTimestamps();
        return this.clickTimestamps.length;
    }

    /**
     * Checks if the current click behavior triggers auto-click detection.
     * @returns {boolean} True if detection is triggered.
     */
    detectAutoClick() {
        const cps = this.calculateCPS();
        const now = Date.now();

        if (cps >= this.threshold) {
            if (!this.sustainedHighCPSStart) {
                this.sustainedHighCPSStart = now;
            }
            
            // Check if high CPS has been sustained long enough
            if (now - this.sustainedHighCPSStart >= this.sustainedDurationMs) {
                return true;
            }
        } else {
            // Reset sustained tracker if CPS drops below threshold
            this.sustainedHighCPSStart = null;
        }

        return false;
    }

    reset() {
        this.clickTimestamps = [];
        this.sustainedHighCPSStart = null;
    }
}
