// script/main.js
/**
 * main.js
 * Core game engine for Bounty Clicker.
 * Handles click detection, progression logic, UI updates, and real-time syncing.
 * Optimized for performance and modularity.
 */

import { checkAuth, logout } from './auth.js';
import { 
  loadUserData, 
  saveUserData, 
  syncCorrectionToFirebase,
  listenToAdminCommands,
  markAdminCommandProcessed,
  listenToPendingRewards,
  claimAdminReward
} from './database.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { ClickDetection } from './click-detection.js';
import { AutoclickProtection } from './autoclick-protection.js';

(() => {
  // --- Game State Management ---
  window.BountyGame = window.BountyGame || {};
  let currentUser = null;
  let currentUsername = "Anonyme";
  let gameLoaded = false;
  let pendingRewards = [];

  // DOM Cache for performance
  const DOM = {
    img: document.getElementById('image'),
    counter: document.getElementById('counter'),
    cps: document.getElementById('cps'),
    resetBtn: document.getElementById('resetButton'),
    saveBtn: document.getElementById('saveButton'),
    progressBar: document.getElementById('progressBar'),
    progressPercent: document.getElementById('progressPercent'),
    gemInfo: document.getElementById('gemInfo'),
    tokenInfo: document.getElementById('tokenInfo'),
    rebirthBtn: document.getElementById('rebirthButton'),
    rebirthInfo: document.getElementById('rebirthInfo'),
    prestigeInfo: document.getElementById('prestigeInfo'),
    rewardNotif: document.getElementById('reward-notification'),
    rewardModal: document.getElementById('reward-modal'),
    rewardList: document.getElementById('reward-list'),
    layout: document.querySelector('.game-layout')
  };

  // Anti-cheat initialization
  const detector = new ClickDetection(40, 1000); 
  const protection = new AutoclickProtection();

  window.onAutoClickUnlock = () => detector.reset();

  // Default game state structure
  const DEFAULT_GAME_STATE = {
    count: 0,
    multiplier: 1,
    shopMultiplierBonus: 0,
    clickValue: 1,
    addClickBonus: 0,
    addCageBonus: 0,
    cps: 0,
    rebirths: 0,
    prestigePoints: 0,
    rabbitGems: 0,
    rabbitTokens: 0,
    unlockedUpgrades: [],
    unlockedCurrencyUpgrades: [],
    rebirthBonusClick: 0,
    rebirthBonusCPS: 0,
    rebirthPrice: 1000000
  };

  // Initialize state defensively
  if (!window.BountyGame.initialized) {
    Object.keys(DEFAULT_GAME_STATE).forEach(key => {
      if (window.BountyGame[key] === undefined) {
        window.BountyGame[key] = DEFAULT_GAME_STATE[key];
      }
    });
    window.BountyGame.initialized = true;
  }

  // Assets
  const ASSETS = {
    images: [
      'assets/images/bounty.jpg','assets/images/bounty2.jpg','assets/images/bounty3.jpg',
      'assets/images/bounty4.jpg','assets/images/bounty5.jpg','assets/images/bounty6.jpg',
      'assets/images/bounty7.jpg','assets/images/bounty8.jpg','assets/images/bountygraille.jpg'
    ]
  };
  
  // Preload images
  ASSETS.preloaded = ASSETS.images.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  let lastImageIdx = -1;

  // --- Visual Utilities ---

  function changerImage(){
    if (!DOM.img) return;
    let idx;
    do { 
      idx = Math.floor(Math.random() * ASSETS.images.length); 
    } while (ASSETS.images.length > 1 && idx === lastImageIdx);
    
    lastImageIdx = idx;
    DOM.img.src = ASSETS.images[idx];
  }

  function spawnPlusOne(x, y, value, isToken = false){
    const el = document.createElement('div');
    el.className = 'plus-one';
    el.textContent = isToken ? `+1` : `+${Math.floor(value)}`;
    if (isToken) el.style.color = "#ff3cac";
    
    const rotation = Math.random() * 40 - 20;
    const size = isToken ? 22 : Math.min(40, 20 + (value / 10)); 
    
    const left = Math.min(window.innerWidth - 60, Math.max(8, x));
    const top = Math.min(window.innerHeight - 40, Math.max(8, y));
    
    el.style.setProperty('--x', `${left}px`);
    el.style.setProperty('--y', `${top}px`);
    el.style.setProperty('--r', `${rotation}deg`);
    el.style.fontSize = `${size}px`;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  function spawnParticles(x, y, color = 'var(--neon-blue)') {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.backgroundColor = color;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 4;
      p.style.setProperty('--tx', `${Math.cos(angle) * velocity * 20}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * velocity * 20}px`);
      
      fragment.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
    document.body.appendChild(fragment);
  }

  // --- Calculation Logic ---

  function recalculerMultiplier() {
    const g = window.BountyGame;
    let totalMultiplier = 1 + (Number(g.shopMultiplierBonus) || 0);
    let totalClickValue = 1;
    
    // Prestige/Currency Upgrades
    const upgrades = {
      p: g.unlockedUpgrades || [],
      c: g.unlockedCurrencyUpgrades || []
    };

    // --- Multiplier Bonuses (Additive) ---
    if (upgrades.p.includes('upgrade1')) totalMultiplier += 1;
    if (upgrades.p.includes('upgrade2')) totalMultiplier += 2;
    if (upgrades.p.includes('upgrade3') && (g.rebirths || 0) === 0) totalMultiplier += 5;
    if (upgrades.p.includes('upgrade6')) totalMultiplier += 10;
    if (upgrades.p.includes('upgrade9')) totalMultiplier += 25;
    if (upgrades.p.includes('upgrade11')) totalMultiplier += 50;
    if (upgrades.p.includes('upgrade13')) totalMultiplier += 250;
    if (upgrades.p.includes('upgrade16')) totalMultiplier += 1000;
    if (upgrades.p.includes('upgrade19')) totalMultiplier += 10000;
    
    if (upgrades.c.includes('gem_1')) totalMultiplier += 2;
    if (upgrades.c.includes('gem_2')) totalMultiplier += 5;
    if (upgrades.c.includes('token_1')) totalMultiplier += 5;
    if (upgrades.c.includes('token_2')) totalMultiplier += 10;

    // --- Click Value Bonuses (Additive) ---
    if (upgrades.p.includes('upgrade5')) totalClickValue += 10;
    if (upgrades.p.includes('upgrade10')) totalClickValue += 50;
    if (upgrades.p.includes('upgrade14')) totalClickValue += 500;
    if (upgrades.p.includes('upgrade17')) totalClickValue += 2500;
    
    // --- Multiplicative Bonuses ---
    let finalMultiplier = totalMultiplier * (1 + ((Number(g.rabbitGems) || 0) * 0.01));
    let finalClickValue = totalClickValue;

    if (upgrades.p.includes('upgrade20')) {
      finalMultiplier *= 2;
      finalClickValue *= 2;
    }
    if (upgrades.c.includes('token_4')) {
      finalMultiplier *= 1.25;
    }

    g.multiplier = finalMultiplier;
    g.clickValue = finalClickValue;
  }
  window.recalculerMultiplier = recalculerMultiplier;

  // --- UI Update Engine ---

  let uiUpdateRequested = false;
  function updateCounterUI() {
    if (uiUpdateRequested) return;
    uiUpdateRequested = true;

    requestAnimationFrame(() => {
      recalculerMultiplier();
      const g = window.BountyGame;
      const displayCount = Math.max(0, Math.floor(g.count));
      const price = g.rebirthPrice || 1000000;
      const progress = Math.max(0, Math.min(100, (displayCount / price) * 100));

      // Batch DOM updates and only apply if value changed
      const updates = {
        'counter': displayCount.toLocaleString(),
        'cps': `BOUNTY / SEC : ${Math.floor(g.cps).toLocaleString()}`,
        'gemInfo': g.rabbitGems || 0,
        'tokenInfo': g.rabbitTokens || 0,
        'prestigeInfo': g.prestigePoints || 0,
        'rebirthInfo': g.rebirths || 0,
        'multiplierInfo': `x${(g.multiplier ?? 1).toFixed(1)}`,
        'clickValueInfo': Math.floor((g.clickValue ?? 1) + (g.addClickBonus ?? 0) + (g.rebirthBonusClick ?? 0)).toLocaleString()
      };

      for (const [id, val] of Object.entries(updates)) {
        const el = DOM[id] || document.getElementById(id);
        if (el && el.textContent !== String(val)) {
          el.textContent = val;
        }
      }

      if (DOM.progressBar && DOM.progressPercent) {
        const progressStr = `${progress}%`;
        if (DOM.progressBar.style.width !== progressStr) {
          DOM.progressBar.style.width = progressStr;
          DOM.progressPercent.textContent = `${Math.floor(progress)}%`;
          
          const isReady = progress >= 100;
          DOM.progressBar.classList.toggle('progress-bar-ready', isReady);
          DOM.progressBar.style.background = isReady ? 
            'linear-gradient(90deg, #ffde00, #ffffff)' : 
            'linear-gradient(90deg, var(--neon-blue), #6effff)';
        }
      }
      uiUpdateRequested = false;
    });
  }
  window.updateCounterUI = updateCounterUI;

  function calculCPS(){
    let total = 0;
    const items = window.storeItemsData || [];
    const boosts = window.boostsData || [];

    items.forEach(it => {
      if (it.auto && it.owned) {
        let gain = it.auto * it.owned;
        if (boosts[1]?.active) gain *= 2;
        if (boosts[4]?.active) gain *= 1.05;
        if (boosts[6]?.active) gain *= 1.20;
        if (boosts[11]?.active) gain *= 5;
        if (boosts[12]?.active) gain *= 10;
        total += gain;
      }
    });

    total += (window.BountyGame.rebirthBonusCPS || 0);
    
    const p = window.BountyGame.unlockedUpgrades || [];
    const c = window.BountyGame.unlockedCurrencyUpgrades || [];

    if (p.includes('upgrade4')) total *= 1.10;
    if (p.includes('upgrade8')) total *= 1.25;
    if (p.includes('upgrade12')) total *= 2;
    if (p.includes('upgrade15')) total *= 5;
    if (p.includes('upgrade18')) total *= 10;
    if (p.includes('upgrade20')) total *= 2;
    if (c.includes('gem_3')) total *= 1.20;
    if (c.includes('token_4')) total *= 1.25;

    return total;
  }

  // --- Click Handler ---

  if (DOM.img) {
    DOM.img.addEventListener('click', (ev) => {
      if (protection.getIsLocked()) return;

      recalculerMultiplier(); // Ensure we have latest values
      const g = window.BountyGame;
      const multiplier = Math.max(1, Number(g.multiplier) || 1);
      const boosts = window.boostsData || [];
      
      let bonus = multiplier;
      if (boosts[0]?.active) bonus *= 1.5;
      if (boosts[2]?.active) bonus = Math.random() < 0.5 ? 0 : bonus * 2;
      if (boosts[5]?.active) bonus *= 1.10;
      if (boosts[8]?.active) bonus *= 2;
      if (boosts[10]?.active) bonus *= 2;
      if (boosts[12]?.active) bonus *= 10;

      const baseClick = (Number(g.clickValue) || 1) + (g.addClickBonus || 0) + (g.addCageBonus || 0) + (g.rebirthBonusClick || 0);
      const gain = Math.max(1, baseClick * bonus);

      // Cheat detection
      detector.recordClick(gain, ev);
      if (detector.detectAutoClick()) {
        protection.triggerWarning(detector.getInvalidRewards(), (newCount, violations) => {
          if (currentUser) syncCorrectionToFirebase(currentUser.uid, newCount, violations);
        });
        return;
      }

      g.count += gain;

      // Rare token drop
      if (Math.random() < 0.01) {
        g.rabbitTokens = (g.rabbitTokens || 0) + 1;
        spawnPlusOne(ev.clientX, ev.clientY - 30, 1, true);
      }

      // Visual feedback
      const tilt = Math.random() * 10 - 5;
      DOM.img.style.transform = `scale(0.95) rotate(${tilt}deg)`;
      setTimeout(() => DOM.img.style.transform = '', 100);

      spawnPlusOne(ev.clientX, ev.clientY, gain);
      spawnParticles(ev.clientX, ev.clientY);
      changerImage();
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
    });
  }

  // --- Game Loop ---
  let lastStoreUpdate = 0;
  setInterval(() => {
    const g = window.BountyGame;
    const cpsGain = calculCPS();
    g.count = Math.max(0, g.count + cpsGain);
    g.cps = cpsGain;
    
    // Ambient feedback
    if (cpsGain > 0 && Math.random() < 0.1 && DOM.img) { 
        const rect = DOM.img.getBoundingClientRect();
        spawnPlusOne(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height, cpsGain);
    }
    
    updateCounterUI();
    
    const now = Date.now();
    if (now - lastStoreUpdate > 5000) {
      if (typeof window.updateStore === 'function') window.updateStore();
      lastStoreUpdate = now;
    }
  }, 1000);

  // --- Data Persistence ---

  async function sauvegarderJeu(){
    if (!currentUser || !gameLoaded) return;
    const g = window.BountyGame;
    const data = {
      ...g,
      storeItems: (window.storeItemsData || []).map(it => ({ owned: it.owned, price: it.price })),
      boosts: (window.boostsData || []).map(b => ({ active: !!b.active, permanent: !!b.permanent })),
      violations: protection.violations
    };
    try {
      await saveUserData(currentUser.uid, data, currentUsername);
    } catch (e) {
      console.error("Autosave failed:", e);
    }
  }
  window.sauvegarderJeu = sauvegarderJeu;

  async function chargerJeu(uid){
    try {
      const fullData = await loadUserData(uid);
      gameLoaded = true;
      
      if (!fullData || !fullData.gameData) return;
      
      const data = fullData.gameData;
      currentUsername = fullData.profile?.username || fullData.profile?.email?.split('@')[0] || "Anonyme";
      
      const titleEl = document.querySelector('.panel.clicker h1');
      if (titleEl) titleEl.textContent = `Bounty Clicker - ${currentUsername}`;
      
      Object.assign(window.BountyGame, data);
      applyRebirthBonus();
      if (data.violations) protection.violations = data.violations;

      if (Array.isArray(data.storeItems) && window.storeItemsData) {
        data.storeItems.forEach((s, i) => {
          if (window.storeItemsData[i]) {
            window.storeItemsData[i].owned = s.owned ?? 0;
            window.storeItemsData[i].price = s.price ?? window.storeItemsData[i].basePrice;
          }
        });
      }

      if (Array.isArray(data.boosts) && window.boostsData) {
        data.boosts.forEach((b, i) => {
          if (window.boostsData[i]) {
            window.boostsData[i].active = !!b.active;
            window.boostsData[i].permanent = !!b.permanent;
          }
        });
      }
    } catch (e) {
      console.error("Loading failed:", e);
    }
  }

  // --- Reward System ---

  function updateRewardUI() {
    if (!DOM.rewardNotif) return;
    const claimed = window.BountyGame.claimedRewards || [];
    const available = pendingRewards.filter(r => !claimed.includes(r.id));
    DOM.rewardNotif.classList.toggle('hidden', available.length === 0);
  }

  window.openRewardModal = () => {
    if (!DOM.rewardModal || !DOM.rewardList) return;
    const claimed = window.BountyGame.claimedRewards || [];
    const available = pendingRewards.filter(r => !claimed.includes(r.id));
    
    DOM.rewardList.innerHTML = available.map(reward => {
      const d = reward.rewardData;
      let text = "";
      if (d.clicks > 0) text += `<div><b>${Math.floor(d.clicks).toLocaleString()}</b> Croquettes</div>`;
      if (d.gems > 0) text += `<div><b>${d.gems}</b> Gemmes</div>`;
      if (d.tokens > 0) text += `<div><b>${d.tokens}</b> Jetons</div>`;
      if (d.prestige > 0) text += `<div><b>${d.prestige}</b> Prestige</div>`;
      
      return `<div class="reward-item"><div style="text-align: left;"><div style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 5px;">${d.title || 'Pack Cadeau'}</div>${text}</div></div>`;
    }).join('');

    DOM.rewardModal.classList.remove('hidden');
  };

  window.claimRewards = async () => {
    if (!currentUser) return;
    const claimed = window.BountyGame.claimedRewards || [];
    const available = pendingRewards.filter(r => !claimed.includes(r.id));
    if (available.length === 0) return;

    try {
      for (const reward of available) {
        const d = await claimAdminReward(currentUser.uid, reward.id);
        const g = window.BountyGame;
        if (d.clicks > 0) g.count += d.clicks;
        if (d.gems > 0) g.rabbitGems = (g.rabbitGems || 0) + d.gems;
        if (d.tokens > 0) g.rabbitTokens = (g.rabbitTokens || 0) + d.tokens;
        if (d.prestige > 0) g.prestigePoints = (g.prestigePoints || 0) + d.prestige;
        
        if (reward.targetUid === 'ALL') {
          g.claimedRewards = g.claimedRewards || [];
          g.claimedRewards.push(reward.id);
        }
      }
      DOM.rewardModal?.classList.add('hidden');
      updateCounterUI();
      updateRewardUI();
      sauvegarderJeu();
      alert("Récompenses récupérées avec succès !");
    } catch (e) {
      console.error("Claim failed:", e);
    }
  };

  // --- Administrative Commands ---

  async function handleAdminCommand(cmd) {
    const { type, data } = cmd;
    const g = window.BountyGame;
    let effectTriggered = false;

    switch(type) {
      case 'ADD_CURRENCY': g.count += Number(data.amount) || 0; effectTriggered = true; break;
      case 'SUB_CURRENCY': g.count = Math.max(0, g.count - (Number(data.amount) || 0)); effectTriggered = true; break;
      case 'ADD_PRESTIGE': g.prestigePoints += Number(data.amount) || 0; effectTriggered = true; break;
      case 'GIVE_UPGRADE': 
        if (data.upgradeId && !g.unlockedUpgrades.includes(data.upgradeId)) {
          g.unlockedUpgrades.push(data.upgradeId); effectTriggered = true; 
        } break;
      case 'TRIGGER_BOOST': 
        if (window.boostsData?.[data.boostIdx]) {
          window.boostsData[data.boostIdx].active = true;
          window.boostsData[data.boostIdx].permanent = true;
          effectTriggered = true;
        } break;
      case 'RECALCULATE_STATS': recalculerMultiplier(); effectTriggered = true; break;
      case 'MARKET_MOON':
        try {
          const { updateMarketData } = await import('./database.js');
          await updateMarketData(null, null, { trend: 1, momentum: 0.5, trendDuration: 50, currentNews: { title: "ADMIN INTERVENTION: TO THE MOON!", impact: 2, type: 'positive' } });
          effectTriggered = true;
        } catch (e) { console.error("Moon failed:", e); }
        break;
      case 'RESET_PLAYER': 
        Object.assign(g, DEFAULT_GAME_STATE);
        (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
        (window.boostsData || []).forEach(b => { b.active = false; b.available = false; b.permanent = false; });
        effectTriggered = true; break;
      case 'SPAWN_EVENT':
        if (data.type === 'GOLDEN_CARROT') {
          const bonus = (g.multiplier || 1) * 1000;
          g.count += bonus;
          alert(`ADMIN EVENT: Carotte Dorée ! +${bonus.toLocaleString()} croquettes !`);
          effectTriggered = true;
        } break;
    }

    if (effectTriggered) {
      updateCounterUI();
      updateRebirthUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      if (typeof window.updatePrestigeTree === 'function') window.updatePrestigeTree();
      await markAdminCommandProcessed(cmd.id);
      sauvegarderJeu();
    }
  }

  // --- Rebirth & Prestige ---

  function applyRebirthBonus(){
    const g = window.BountyGame;
    g.rebirthBonusClick = (g.rebirths || 0) * 1;
    g.rebirthBonusCPS = (g.rebirths || 0) * 0.2;
    recalculerMultiplier();
  }
  window.applyRebirthBonus = applyRebirthBonus;

  function updateRebirthUI(){
    const g = window.BountyGame;
    const curR = g.rebirths || 0;
    let gain = curR >= 500 ? 25 : curR >= 250 ? 10 : curR >= 100 ? 5 : curR >= 50 ? 2 : 1;

    if (DOM.rebirthInfo) DOM.rebirthInfo.textContent = `Rebirths : ${curR}`;
    if (DOM.prestigeInfo) DOM.prestigeInfo.textContent = `Prestige : ${Math.floor(g.prestigePoints || 0).toLocaleString()}`;
    if (DOM.rebirthBtn) {
      const price = g.rebirthPrice || 0;
      DOM.rebirthBtn.textContent = `Rebirth${gain > 1 ? ` (+${gain})` : ''} (${price.toLocaleString()})`;
      DOM.rebirthBtn.disabled = g.count < price;
    }
  }
  window.updateRebirthUI = updateRebirthUI;

  // --- Auth & Init ---

  checkAuth(async (user) => {
    currentUser = user;
    await chargerJeu(user.uid);
    
    // UI Init
    if (typeof window.updateStore === 'function') window.updateStore();
    if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
    updateCounterUI();
    updateRebirthUI();
    changerImage();

    // Event listeners
    listenToAdminCommands(user.uid, handleAdminCommand);
    listenToPendingRewards(user.uid, (rewards) => {
      pendingRewards = rewards;
      updateRewardUI();
    });
    
    setInterval(sauvegarderJeu, 120000);
    DOM.layout?.classList.add('loaded');
  });

  window.logout = logout;

  // Global Click delegation
  document.addEventListener('click', async (e) => {
    // Rebirth handler
    if (e.target?.id === 'rebirthButton') {
      if (e.target.disabled) return;
      const g = window.BountyGame;
      const price = g.rebirthPrice || 1000000;
      
      if (g.count < price) return alert(`Il faut ${price.toLocaleString()} croquettes.`);
      
      const curR = g.rebirths || 0;
      let gain = curR >= 500 ? 25 : curR >= 250 ? 10 : curR >= 100 ? 5 : curR >= 50 ? 2 : 1;
      
      if (!confirm(`Faire un Rebirth (+${gain}) pour ${price.toLocaleString()} ?`)) return;

      // Deduct and reset
      g.rebirths += gain;
      let prestigeGain = 0;
      for(let i=0; i<gain; i++) prestigeGain += Math.floor(2 + ((curR+i+1)/2)) * (g.unlockedUpgrades?.includes('rebirth_boost_1') ? 1.25 : 1);
      
      g.prestigePoints = (g.prestigePoints || 0) + prestigeGain;
      const newGems = Math.floor(gain / 10);
      if (newGems > 0) {
        g.rabbitGems = (g.rabbitGems || 0) + newGems;
        alert(`Gagné ${newGems} Gemme(s) !`);
      }

      // Reset cycle
      g.count = 0;
      g.multiplier = 1;
      g.shopMultiplierBonus = 0;
      g.clickValue = 1;
      g.cps = 0;
      
      if (window.storeItemsData) window.storeItemsData.forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
      if (window.boostsData) window.boostsData.forEach(b => { b.active = false; b.available = false; b.permanent = false; });

      applyRebirthBonus();
      g.rebirthPrice = 1000000 + (g.rebirths * 2_000_000);
      
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      if (typeof window.updatePrestigeUI === 'function') window.updatePrestigeUI();
      if (typeof window.updatePrestigeTree === 'function') window.updatePrestigeTree();
      
      sauvegarderJeu();
      updateRebirthUI();
    }
    
    // Modal close
    if (e.target === DOM.rewardModal) DOM.rewardModal.classList.add('hidden');
  });

})();
