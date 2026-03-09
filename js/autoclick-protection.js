/**
 * autoclick-protection.js
 * Manages the UI and lockout logic for the auto-click warning.
 */

export class AutoclickProtection {
    constructor() {
        this.violations = 0;
        this.isLocked = false;
        this.lockoutDurations = [10, 20, 30, 60]; 
        this.overlay = null;
        this.timerEl = null;
        this.btnEl = null;
        this.countdownInterval = null;
        this.integrityCheckInterval = null;
        
        this.initUI();
        this.checkPersistentLockout();
        this.startIntegrityCheck();
    }

    /**
     * Checks if a lockout was active before page refresh
     */
    checkPersistentLockout() {
        const savedLockout = localStorage.getItem('bc_lockout_expiry');
        if (savedLockout) {
            const expiry = parseInt(savedLockout);
            const now = Date.now();
            
            if (now < expiry) {
                // Page was refreshed during a lockout!
                // Apply 5 minute penalty (300 seconds)
                const penaltyDuration = 300; 
                this.triggerWarning(0, null, penaltyDuration, true);
            } else {
                localStorage.removeItem('bc_lockout_expiry');
            }
        }
    }

    /**
     * Periodically checks if the overlay is still there and visible if locked
     */
    startIntegrityCheck() {
        if (this.integrityCheckInterval) return;
        this.integrityCheckInterval = setInterval(() => {
            if (this.isLocked) {
                const check = document.getElementById('autoclick-overlay');
                if (!check || check.classList.contains('hidden') || check.style.display === 'none') {
                    // Re-enable the lock if bypassed
                    this.initUI();
                    this.overlay.classList.remove('hidden');
                    this.overlay.style.display = 'flex';
                }
            }
        }, 3000);
    }

    initUI() {
        if (document.getElementById('autoclick-overlay')) {
            this.overlay = document.getElementById('autoclick-overlay');
            this.timerEl = document.getElementById('autoclick-timer');
            this.btnEl = document.getElementById('autoclick-btn');
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'autoclick-overlay';
        overlay.className = 'autoclick-overlay hidden';
        overlay.innerHTML = `
            <div class="autoclick-content">
                <div class="warning-icon" id="autoclick-icon">🧊</div>
                <h1 id="autoclick-title">MOLO SUR LE CLICK !</h1>
                <p id="autoclick-msg">Ça clique un peu trop vite pour un humain ! Prends une petite pause de quelques secondes pour reposer tes doigts.</p>
                <div id="autoclick-timer" class="autoclick-timer">00:00</div>
                <button id="autoclick-btn" class="autoclick-btn" disabled>REPOS EN COURS...</button>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 15px;">Le jeu reprendra automatiquement après le décompte.</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.overlay = overlay;
        this.timerEl = document.getElementById('autoclick-timer');
        this.btnEl = document.getElementById('autoclick-btn');

        this.btnEl.onclick = () => this.unlockClicking();
    }

    triggerWarning(invalidRewards = 0, onCorrection = null, forceDuration = null, isRefreshPenalty = false) {
        if (this.isLocked && !isRefreshPenalty) return;

        if (!isRefreshPenalty) this.violations++;
        this.isLocked = true;
        
        // On réduit la confiscation pour être moins punitif, on ne retire que le surplus suspect
        const penalty = invalidRewards; 
        
        if (window.BountyGame && penalty > 0) {
            window.BountyGame.count = Math.max(0, window.BountyGame.count - penalty);
            if (typeof window.updateCounterUI === 'function') window.updateCounterUI();
            
            if (onCorrection) {
                onCorrection(window.BountyGame.count, this.violations);
            } else if (typeof window.sauvegarderJeu === 'function') {
                window.sauvegarderJeu();
            }
        }

        this.overlay.classList.remove('hidden');
        this.overlay.style.display = 'flex';
        document.querySelector('.game-layout')?.classList.add('blurred');
        
        const titleEl = document.getElementById('autoclick-title');
        const msgEl = document.getElementById('autoclick-msg');
        const iconEl = document.getElementById('autoclick-icon');

        let secondsLeft;
        if (forceDuration) {
            secondsLeft = forceDuration;
        } else {
            const durationIdx = Math.min(this.violations - 1, this.lockoutDurations.length - 1);
            secondsLeft = this.lockoutDurations[durationIdx];
        }

        if (isRefreshPenalty) {
            titleEl.textContent = "TENTATIVE DE CONTOURNEMENT";
            msgEl.innerHTML = "Tu as essayé de rafraîchir la page pour éviter la pause ? <br><br><strong>Pénalité de 5 minutes appliquée.</strong>";
            iconEl.textContent = "🚫";
        } else {
            titleEl.textContent = "MOLO SUR LE CLICK !";
            msgEl.textContent = "Ça clique un peu trop vite pour un humain ! Prends une petite pause de quelques secondes pour reposer tes doigts.";
            iconEl.textContent = "🧊";
        }

        // Save expiry to localStorage to detect next refresh
        const expiry = Date.now() + (secondsLeft * 1000);
        localStorage.setItem('bc_lockout_expiry', expiry.toString());

        this.btnEl.disabled = true;
        this.btnEl.textContent = forceDuration ? "BLOQUÉ..." : "REPOS...";
        this.updateTimerDisplay(secondsLeft);

        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(() => {
            secondsLeft--;
            this.updateTimerDisplay(secondsLeft);

            if (secondsLeft <= 0) {
                clearInterval(this.countdownInterval);
                this.btnEl.disabled = false;
                this.btnEl.textContent = "C'est bon, je reprends !";
                localStorage.removeItem('bc_lockout_expiry');
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
