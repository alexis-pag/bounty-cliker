/**
 * autoclick-protection.js
 * Manages the UI and lockout logic for the auto-click warning.
 */

export class AutoclickProtection {
    constructor() {
        this.violations = 0;
        this.isLocked = false;
        this.lockoutDurations = [15, 30, 60, 120]; // Lockout seconds per violation level
        this.overlay = null;
        this.timerEl = null;
        this.btnEl = null;
        this.countdownInterval = null;
        
        this.initUI();
    }

    /**
     * Dynamically creates the warning overlay.
     */
    initUI() {
        if (document.getElementById('autoclick-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'autoclick-overlay';
        overlay.className = 'autoclick-overlay hidden';
        overlay.innerHTML = `
            <div class="autoclick-content">
                <h1>⚠️ AUTO-CLICK DETECTED</h1>
                <p>Abnormally high click rate detected. Please stop using an auto-clicker to maintain game balance.</p>
                <div id="autoclick-timer" class="autoclick-timer">00:00</div>
                <button id="autoclick-btn" class="autoclick-btn" disabled>Wait for countdown...</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.overlay = overlay;
        this.timerEl = document.getElementById('autoclick-timer');
        this.btnEl = document.getElementById('autoclick-btn');

        this.btnEl.onclick = () => this.unlockClicking();
    }

    /**
     * Triggers the warning and locks the game.
     * @param {number} invalidRewards Total carrots to remove
     * @param {Function} onCorrection Callback to sync data (e.g., to Firebase)
     */
    triggerWarning(invalidRewards = 0, onCorrection = null) {
        if (this.isLocked) return;

        this.violations++;
        this.isLocked = true;
        
        // Remove illegal rewards if game state is accessible
        if (invalidRewards > 0 && window.BountyGame) {
            window.BountyGame.count = Math.max(0, window.BountyGame.count - invalidRewards);
            if (typeof window.updateCounterUI === 'function') window.updateCounterUI();
            
            // Critical sync to Firebase
            if (onCorrection) {
                onCorrection(window.BountyGame.count, this.violations);
            } else if (typeof window.sauvegarderJeu === 'function') {
                window.sauvegarderJeu();
            }
        }

        // Show overlay and blur background
        this.overlay.classList.remove('hidden');
        document.querySelector('.game-layout')?.classList.add('blurred');
        
        // Update message to inform about removal
        const msgPara = this.overlay.querySelector('p');
        msgPara.innerHTML = `Abnormally high click rate detected. <br><strong>${Math.floor(invalidRewards)} carrots</strong> obtained illegitimateley have been removed.`;

        // Calculate lockout duration based on violation level
        const durationIdx = Math.min(this.violations - 1, this.lockoutDurations.length - 1);
        let secondsLeft = this.lockoutDurations[durationIdx];

        this.btnEl.disabled = true;
        this.btnEl.textContent = "Wait for countdown...";
        this.updateTimerDisplay(secondsLeft);

        // Countdown logic
        this.countdownInterval = setInterval(() => {
            secondsLeft--;
            this.updateTimerDisplay(secondsLeft);

            if (secondsLeft <= 0) {
                clearInterval(this.countdownInterval);
                this.btnEl.disabled = false;
                this.btnEl.textContent = "I understand, return to game";
            }
        }, 1000);
    }

    /**
     * Formats and updates the countdown timer display.
     */
    updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Resets UI and unlocks clicking.
     */
    unlockClicking() {
        this.isLocked = false;
        this.overlay.classList.add('hidden');
        document.querySelector('.game-layout')?.classList.remove('blurred');
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Notify global game state that clicking can resume
        if (typeof window.onAutoClickUnlock === 'function') {
            window.onAutoClickUnlock();
        }
    }

    getIsLocked() {
        return this.isLocked;
    }
}
