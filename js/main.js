// script/main.js
import { checkAuth, logout } from './auth.js';
import { 
  loadUserData, 
  saveUserData, 
  syncCorrectionToFirebase,
  listenToAdminCommands,
  markAdminCommandProcessed
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
  window.BountyGame = window.BountyGame || {};
  let currentUser = null;
  let currentUsername = null;
  let gameLoaded = false;

  // Initialisation du système de protection
  const detector = new ClickDetection(40, 1000); // 40 CPS threshold
  const protection = new AutoclickProtection();

  window.onAutoClickUnlock = () => {
    detector.reset();
  };

  // Initialisation des variables de jeu par défaut
  const defaultGameState = {
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
    unlockedUpgrades: [],
    rebirthBonusClick: 0,
    rebirthBonusCPS: 0,
    rebirthPrice: 1000000
  };

  // On initialise seulement si non présent pour garder les données chargées
  if (!window.BountyGame) {
    window.BountyGame = { ...defaultGameState };
  } else {
    // S'assurer que les propriétés essentielles existent
    for (const key in defaultGameState) {
      if (window.BountyGame[key] === undefined) {
        window.BountyGame[key] = defaultGameState[key];
      }
    }
  }

  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const resetButton = document.getElementById('resetButton');

  const images = [
    'assets/images/bounty.jpg','assets/images/bounty2.jpg','assets/images/bounty3.jpg',
    'assets/images/bounty4.jpg','assets/images/bounty5.jpg','assets/images/bounty6.jpg',
    'assets/images/bounty7.jpg','assets/images/bounty8.jpg','assets/images/bountygraille.jpg'
  ];
  
  // Préchargement des images pour fluidité
  const preloadedImages = [];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
    preloadedImages.push(img);
  });

  let lastImageIdx = -1;

  function changerImage(){
    if (!imgEl) return;
    let idx;
    do { idx = Math.floor(Math.random() * images.length); } while (images.length > 1 && idx === lastImageIdx);
    lastImageIdx = idx;
    imgEl.src = images[idx];
  }

  function spawnPlusOne(x, y, value){
    const el = document.createElement('div');
    el.className = 'plus-one';
    el.textContent = `+${Math.floor(value)}`;
    
    // Ajout de "juice" : rotation et taille aléatoire
    const rotation = Math.random() * 40 - 20;
    const size = Math.min(40, 20 + (value / 10)); 
    
    const left = Math.min(window.innerWidth - 60, Math.max(8, x));
    const top = Math.min(window.innerHeight - 40, Math.max(8, y));
    
    el.style.setProperty('--x', `${left}px`);
    el.style.setProperty('--y', `${top}px`);
    el.style.setProperty('--r', `${rotation}deg`);
    el.style.fontSize = size + 'px';
    
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 950);
  }

  function recalculerMultiplier() {
    const shopBonus = window.BountyGame.shopMultiplierBonus || 0;
    const rebirthCount = window.BountyGame.rebirths || 0;
    const unlocked = window.BountyGame.unlockedUpgrades || [];
    
    let total = 1 + shopBonus;
    
    if (unlocked.includes('upgrade1')) total += 1;
    if (unlocked.includes('upgrade2')) total += 2;
    if (unlocked.includes('upgrade3') && rebirthCount === 0) total += 5;
    if (unlocked.includes('upgrade6')) total += 10;
    if (unlocked.includes('upgrade9')) total += 25;
    if (unlocked.includes('upgrade11')) total += 50;
    if (unlocked.includes('upgrade13')) total += 250;
    
    // Bonus permanent Rabbit Gems (1% par gemme sur le total)
    const gemBonus = 1 + ((window.BountyGame.rabbitGems || 0) * 0.01);
    
    window.BountyGame.multiplier = total * gemBonus;
  }
  window.recalculerMultiplier = recalculerMultiplier;

  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');

  function updateCounterUI(){
    recalculerMultiplier();
    const displayCount = Math.max(0, Math.floor(window.BountyGame.count));
    if (counterEl) counterEl.textContent = `Croquettes : ${displayCount} (×${(window.BountyGame.multiplier ?? 1)})`;
    if (cpsEl) cpsEl.textContent = `CPS : ${Math.floor(window.BountyGame.cps)}`;
    
    // Mise à jour de la barre de progression
    if (progressBar && progressPercent) {
      const rebirthPrice = window.BountyGame.rebirthPrice || 1000000;
      const progress = Math.min(100, (displayCount / rebirthPrice) * 100);
      progressBar.style.width = `${progress}%`;
      progressPercent.textContent = `${Math.floor(progress)}%`;
      
      // Effet visuel quand prêt pour rebirth
      const isReady = progress >= 100;
      if (isReady && !progressBar.classList.contains('progress-bar-ready')) {
        progressBar.style.background = 'linear-gradient(90deg, #ffde00, #ffffff)';
        progressBar.classList.add('progress-bar-ready');
        progressBar.classList.remove('progress-bar-glow');
      } else if (!isReady && progressBar.classList.contains('progress-bar-ready')) {
        progressBar.style.background = 'linear-gradient(90deg, var(--neon-blue), #6effff)';
        progressBar.classList.remove('progress-bar-ready');
        progressBar.classList.add('progress-bar-glow');
      }
    }
  }
  window.updateCounterUI = updateCounterUI;

  function calculCPS(){
    let total = 0;
    const items = window.storeItemsData || [];
    const boosts = window.boostsData || [];

    items.forEach(it => {
      if (it.auto && it.owned) {
        let gain = it.auto * it.owned;
        if (boosts[1] && boosts[1].active) gain *= 2;
        if (boosts[4] && boosts[4].active) gain *= 1.05;
        if (boosts[6] && boosts[6].active) gain *= 1.20;
        
        // Nouveaux boosts
        if (boosts[11] && boosts[11].active) gain *= 5; // Surdosage de carottes
        if (boosts[12] && boosts[12].active) gain *= 10; // Super Boost Temporel
        
        total += gain;
      }
    });

    total += (window.BountyGame.rebirthBonusCPS || 0);
    
    // Bonus prestige CPS
    const unlocked = window.BountyGame.unlockedUpgrades || [];
    if (unlocked.includes('upgrade4')) total *= 1.10;
    if (unlocked.includes('upgrade8')) total *= 1.25;
    if (unlocked.includes('upgrade12')) total *= 2;
    if (unlocked.includes('upgrade15')) total *= 5;
    if (unlocked.includes('upgrade18')) total *= 10;
    if (unlocked.includes('upgrade20')) total *= 2;
    
    return total;
  }

  if (imgEl) {
    imgEl.addEventListener('click', (ev) => {
      // Vérifier si le jeu est bloqué (Protection anti-autoclick)
      if (protection.getIsLocked()) return;

      console.log("Clic détecté sur l'image");
      
      // S'assurer que les valeurs essentielles sont des nombres valides
      if (!window.BountyGame) window.BountyGame = {};
      
      const count = Number(window.BountyGame.count) || 0;
      const multiplier = Math.max(1, Number(window.BountyGame.multiplier) || 1);
      const unlocked = window.BountyGame.unlockedUpgrades || [];
      const addClickBonus = Number(window.BountyGame.addClickBonus) || 0;
      const addCageBonus = Number(window.BountyGame.addCageBonus) || 0;
      const rebirthBonusClick = Number(window.BountyGame.rebirthBonusClick) || 0;
      let clickValue = Number(window.BountyGame.clickValue) || 1;

      let bonus = multiplier;
      const boosts = window.boostsData || [];
      
      // Application des bonus actifs
      if (boosts[0]?.active) bonus *= 1.5;
      if (boosts[2]?.active) {
        if (Math.random() < 0.5) bonus = 0;
        else bonus *= 2;
      }
      if (boosts[5]?.active) bonus *= 1.10;
      if (boosts[8]?.active) bonus *= 2;
      
      // Nouveaux boosts
      if (boosts[10]?.active) bonus *= 2; // Adrénaline de lapin
      if (boosts[12]?.active) bonus *= 10; // Super Boost Temporel

      if (unlocked.includes('upgrade5')) clickValue += 10;
      if (unlocked.includes('upgrade10')) clickValue += 50;
      if (unlocked.includes('upgrade14')) clickValue += 500;

      const baseClick = clickValue + addClickBonus + addCageBonus + rebirthBonusClick;
      const gain = Math.max(1, baseClick * bonus);

      // Enregistrer le clic avec son gain potentiel et vérifier si c'est anormal
      detector.recordClick(gain, ev);
      if (detector.detectAutoClick()) {
        const invalid = detector.getInvalidRewards();
        protection.triggerWarning(invalid, (newCount, violations) => {
          if (currentUser) {
            syncCorrectionToFirebase(currentUser.uid, newCount, violations);
          }
        });
        return;
      }

      window.BountyGame.count = count + gain;
      window.BountyGame.multiplier = multiplier; // S'assurer qu'il reste valide

      console.log(`Gain: ${gain}, Nouveau Total: ${window.BountyGame.count}`);

      // Effet de tilt aléatoire sur le clic
      const tilt = Math.random() * 10 - 5;
      imgEl.style.transform = `scale(0.95) rotate(${tilt}deg)`;
      setTimeout(() => {
        imgEl.style.transform = '';
      }, 100);

      spawnPlusOne(ev.clientX, ev.clientY, gain);
      changerImage();
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
    });
  }

  let lastStoreUpdate = 0;
  setInterval(() => {
    const now = Date.now();
    const cpsGain = calculCPS();
    window.BountyGame.count = Math.max(0, window.BountyGame.count + cpsGain);
    window.BountyGame.cps = cpsGain;
    
    // Floating CPS Gain (visual feedback) - limited to avoid overload
    if (cpsGain > 0 && Math.random() < 0.15) { 
        const imgRect = imgEl?.getBoundingClientRect();
        if (imgRect) {
            const x = imgRect.left + Math.random() * imgRect.width;
            const y = imgRect.top + Math.random() * imgRect.height;
            spawnPlusOne(x, y, cpsGain);
        }
    }
    
    updateCounterUI();
    
    // On n'update le store que toutes les 5 secondes ou si nécessaire pour perf
    if (now - lastStoreUpdate > 5000) {
      if (typeof window.updateStore === 'function') window.updateStore();
      lastStoreUpdate = now;
    }
  }, 1000);

  async function sauvegarderJeu(){
    if (!currentUser || !gameLoaded) return;
    const data = {
      count: window.BountyGame.count,
      multiplier: window.BountyGame.multiplier ?? 1,
      shopMultiplierBonus: window.BountyGame.shopMultiplierBonus || 0,
      clickValue: window.BountyGame.clickValue,
      addClickBonus: window.BountyGame.addClickBonus,
      addCageBonus: window.BountyGame.addCageBonus,
      cps: window.BountyGame.cps,
      rebirths: window.BountyGame.rebirths,
      prestigePoints: window.BountyGame.prestigePoints,
      rabbitGems: window.BountyGame.rabbitGems || 0,
      unlockedUpgrades: window.BountyGame.unlockedUpgrades || [],
      rebirthPrice: window.BountyGame.rebirthPrice,
      rebirthBonusClick: window.BountyGame.rebirthBonusClick,
      rebirthBonusCPS: window.BountyGame.rebirthBonusCPS,
      violations: protection.violations,
      storeItems: (window.storeItemsData || []).map(it=>({ 
        owned: it.owned, 
        price: it.price 
      })),
      boosts: (window.boostsData || []).map(b=>({ 
        active: !!b.active, 
        permanent: !!b.permanent 
      }))
    };
    try {
      await saveUserData(currentUser.uid, data, currentUsername);
      console.log("Jeu et classement sauvegardés");
    } catch (e) {
      console.error("Erreur lors de la sauvegarde automatique:", e);
    }
  }
  window.sauvegarderJeu = sauvegarderJeu;

  async function chargerJeu(uid){
    try {
      const fullData = await loadUserData(uid);
      gameLoaded = true; // On autorise la sauvegarde après avoir tenté le chargement
      
      if (!fullData || !fullData.gameData) {
        console.log("Nouvel utilisateur, initialisation par défaut.");
        return;
      }
      
      const data = fullData.gameData;
      if (fullData.profile) {
        currentUsername = fullData.profile.username || fullData.profile.email?.split('@')[0] || "Anonyme";
      } else if (data.username) {
        currentUsername = data.username;
      }
      
      const usernameDisplay = document.querySelector('.panel.clicker h1');
      if (usernameDisplay) {
        usernameDisplay.textContent = `Bounty - ${currentUsername}`;
      }
      Object.assign(window.BountyGame, data);
      applyRebirthBonus();
      if (data.violations) protection.violations = data.violations;

      // Restauration de la boutique
      if (Array.isArray(data.storeItems) && window.storeItemsData) {
        data.storeItems.forEach((s, i) => {
          if (window.storeItemsData[i]) {
            window.storeItemsData[i].owned = s.owned ?? 0;
            window.storeItemsData[i].price = s.price ?? window.storeItemsData[i].basePrice;
          }
        });
      }

      // Restauration des boosts
      if (Array.isArray(data.boosts) && window.boostsData) {
        data.boosts.forEach((b, i) => {
          if (window.boostsData[i]) {
            window.boostsData[i].active = !!b.active;
            window.boostsData[i].permanent = !!b.permanent;
            // Si permanent, on ne le propose plus dans le spawn
            if (window.boostsData[i].permanent) {
              window.boostsData[i].available = false;
            }
          }
        });
      }

      updateCounterUI();
      if (typeof window.updateRebirthUI === 'function') window.updateRebirthUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      
      console.log("Jeu chargé avec succès");
    } catch (e) {
      console.error("Erreur lors du chargement du jeu:", e);
    }
  }

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      if (resetButton.disabled) return;
      if (!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
      resetButton.disabled = true;
      
      Object.assign(window.BountyGame, defaultGameState);
      (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
      (window.boostsData || []).forEach(b => { b.active = false; b.available = false; b.permanent = false; });
      applyRebirthBonus();
      await sauvegarderJeu();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      updateCounterUI();
      if (typeof window.updateRebirthUI === 'function') window.updateRebirthUI();
      if (typeof window.updatePrestigeTree === 'function') window.updatePrestigeTree();
      resetButton.disabled = false;
    });
  }

  const saveBtn = document.getElementById('saveButton');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Sauvegarde...";
      await sauvegarderJeu();
      saveBtn.textContent = "C'est fait !";
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 2000);
    });
  }

  function applyRebirthBonus(){
    window.BountyGame.rebirthBonusClick = (window.BountyGame.rebirths || 0) * 1;
    window.BountyGame.rebirthBonusCPS = (window.BountyGame.rebirths || 0) * 0.2;
    applyPrestigeUpgrades();
  }

  /**
   * Gestion des commandes Admin distantes
   */
  async function handleAdminCommand(cmd) {
    console.log("Admin Command Received:", cmd);
    const { type, data } = cmd;
    let effectTriggered = false;

    switch(type) {
      case 'ADD_CURRENCY':
        window.BountyGame.count += Number(data.amount) || 0;
        effectTriggered = true;
        break;
      case 'SUB_CURRENCY':
        window.BountyGame.count = Math.max(0, window.BountyGame.count - (Number(data.amount) || 0));
        effectTriggered = true;
        break;
      case 'ADD_PRESTIGE':
        window.BountyGame.prestigePoints += Number(data.amount) || 0;
        effectTriggered = true;
        break;
      case 'GIVE_UPGRADE':
        if (data.upgradeId && !window.BountyGame.unlockedUpgrades.includes(data.upgradeId)) {
          window.BountyGame.unlockedUpgrades.push(data.upgradeId);
          effectTriggered = true;
        }
        break;
      case 'TRIGGER_BOOST':
        if (window.boostsData && window.boostsData[data.boostIdx]) {
          const b = window.boostsData[data.boostIdx];
          b.active = true;
          b.permanent = true; // On le rend permanent pour l'admin
          effectTriggered = true;
        }
        break;
      case 'RECALCULATE_STATS':
        recalculerMultiplier();
        effectTriggered = true;
        break;
      case 'RESET_PLAYER':
        Object.assign(window.BountyGame, defaultGameState);
        (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
        (window.boostsData || []).forEach(b => { b.active = false; b.available = false; b.permanent = false; });
        effectTriggered = true;
        break;
      case 'SPAWN_EVENT':
        if (data.type === 'GOLDEN_CARROT') {
          // Simulation d'un clic très rentable
          const bonus = (window.BountyGame.multiplier || 1) * 1000;
          window.BountyGame.count += bonus;
          alert("ADMIN EVENT: Une Carotte Dorée est apparue ! +" + bonus + " croquettes !");
          effectTriggered = true;
        }
        break;
    }

    if (effectTriggered) {
      updateCounterUI();
      updateRebirthUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      if (typeof window.updatePrestigeTree === 'function') window.updatePrestigeTree();
      
      // On marque la commande comme traitée
      await markAdminCommandProcessed(cmd.id);
      sauvegarderJeu();
    }
  }

  function applyPrestigeUpgrades() {
    const unlocked = window.BountyGame.unlockedUpgrades || [];
    const rebirthCount = window.BountyGame.rebirths || 0;
    
    // On réinitialise la base
    window.BountyGame.multiplier = 1;
    window.BountyGame.clickValue = 1;
    
    // Application des bonus permanents
    if (unlocked.includes('upgrade1')) window.BountyGame.multiplier += 1;
    if (unlocked.includes('upgrade2')) window.BountyGame.multiplier += 2;
    if (unlocked.includes('upgrade3') && rebirthCount === 0) window.BountyGame.multiplier += 5;
    if (unlocked.includes('upgrade5')) window.BountyGame.clickValue += 10;
    if (unlocked.includes('upgrade6')) window.BountyGame.multiplier += 10;
    if (unlocked.includes('upgrade9')) window.BountyGame.multiplier += 25;
    if (unlocked.includes('upgrade10')) window.BountyGame.clickValue += 50;
    if (unlocked.includes('upgrade11')) window.BountyGame.multiplier += 50;
    if (unlocked.includes('upgrade13')) window.BountyGame.multiplier += 250;
    if (unlocked.includes('upgrade14')) window.BountyGame.clickValue += 500;
    if (unlocked.includes('upgrade16')) window.BountyGame.multiplier += 1000;
    if (unlocked.includes('upgrade17')) window.BountyGame.clickValue += 2500;
    if (unlocked.includes('upgrade19')) window.BountyGame.multiplier += 10000;
    
    // Multiplicateurs finaux
    if (unlocked.includes('upgrade20')) {
      window.BountyGame.multiplier *= 2;
      window.BountyGame.clickValue *= 2;
    }
  }

  function updateRebirthUI(){
    const rebirthBtn = document.getElementById('rebirthButton');
    const rebirthInfo = document.getElementById('rebirthInfo');
    const prestigeInfo = document.getElementById('prestigeInfo');
    
    const curR = window.BountyGame.rebirths || 0;
    let gain = 1;
    if (curR >= 500) gain = 25;
    else if (curR >= 250) gain = 10;
    else if (curR >= 100) gain = 5;
    else if (curR >= 50) gain = 2;

    if (rebirthInfo) rebirthInfo.textContent = `Rebirths : ${curR}`;
    if (prestigeInfo) prestigeInfo.textContent = `Prestige : ${window.BountyGame.prestigePoints || 0}`;
    if (rebirthBtn) {
      const price = window.BountyGame.rebirthPrice || 0;
      const gainText = gain > 1 ? ` (+${gain})` : '';
      rebirthBtn.textContent = `Rebirth${gainText} (${price.toLocaleString()})`;
      rebirthBtn.disabled = window.BountyGame.count < price;
    }
  }
  window.updatePrestigeUI = updateRebirthUI;
  window.updateRebirthUI = updateRebirthUI;

  // Initialisation Auth
  checkAuth(async (user) => {
    currentUser = user;
    await chargerJeu(user.uid);
    if (typeof window.updateStore === 'function') window.updateStore();
    if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
    updateCounterUI();
    updateRebirthUI();
    changerImage();

    // Listen to admin commands
    listenToAdminCommands(user.uid, handleAdminCommand, where, query, collection, onSnapshot);
    
    // Auto-save toutes les 10 secondes
    setInterval(sauvegarderJeu, 10000);

    // Enlever le flash (FOUC)
    document.querySelector('.game-layout')?.classList.add('loaded');
  });

  // Export logout to window for buttons
  window.logout = logout;

  // Event listener for rebirth button if it exists
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'rebirthButton') {
      if (e.target.disabled) return;
      e.target.disabled = true;
      setTimeout(() => { if (e.target) e.target.disabled = (window.BountyGame.count < (window.BountyGame.rebirthPrice || 0)); }, 500);

      const price = window.BountyGame.rebirthPrice || 1000000;
      if (window.BountyGame.count < price) {
        alert(`Il faut ${price.toLocaleString()} croquettes pour rebirth.`);
        return;
      }
      const currentRebirths = window.BountyGame.rebirths || 0;
      let rebirthsToGain = 1;
      
      // Bonus de gain de rebirth à partir de 50
      if (currentRebirths >= 500) rebirthsToGain = 25;
      else if (currentRebirths >= 250) rebirthsToGain = 10;
      else if (currentRebirths >= 100) rebirthsToGain = 5;
      else if (currentRebirths >= 50) rebirthsToGain = 2;

      const rText = rebirthsToGain > 1 ? ` (+${rebirthsToGain} Rebirths)` : '';
      if (!confirm(`Faire un Rebirth${rText} pour ${price.toLocaleString()} croquettes ?`)) return;

      let totalPrestigeGain = 0;
      for (let i = 0; i < rebirthsToGain; i++) {
        const rLevel = currentRebirths + i + 1;
        // Nouvelle formule : gain de base augmenté + bonus exponentiel léger
        // On gagne 2 pts de base + 1 par palier de 2 rebirths
        let gain = Math.floor(2 + (rLevel / 2));
        
        // Bonus upgrade prestige
        if (window.BountyGame.unlockedUpgrades?.includes('rebirth_boost_1')) {
          gain = Math.floor(gain * 1.25);
        }
        
        totalPrestigeGain += gain;
      }

      window.BountyGame.rebirths += rebirthsToGain;
      window.BountyGame.prestigePoints = (window.BountyGame.prestigePoints || 0) + totalPrestigeGain;
      
      // Gain de Rabbit Gems (1 par 10 rebirths cumulés lors du rebirth actuel)
      const newGems = Math.floor(rebirthsToGain / 10);
      if (newGems > 0) {
        window.BountyGame.rabbitGems = (window.BountyGame.rabbitGems || 0) + newGems;
        alert(`Félicitations ! Vous avez gagné ${newGems} Gemme(s) de Lapin !`);
      }
      
      window.BountyGame.count = 0;
      window.BountyGame.multiplier = 1;
      window.BountyGame.shopMultiplierBonus = 0;
      window.BountyGame.clickValue = 1;
      window.BountyGame.addClickBonus = 0;
      window.BountyGame.addCageBonus = 0;
      window.BountyGame.cps = 0;
      
      // Reset store
      if (window.storeItemsData) {
        window.storeItemsData.forEach(it => { 
          it.owned = 0; 
          it.price = it.basePrice ?? it.price; 
        });
      }
      
      // Reset boosts
      if (window.boostsData) {
        window.boostsData.forEach(b => { 
          b.active = false; 
          b.available = false; 
          b.permanent = false; 
        });
      }

      applyRebirthBonus();
      window.BountyGame.rebirthPrice = 1000000 + (window.BountyGame.rebirths * 2_000_000);
      
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      if (typeof window.updatePrestigeUI === 'function') window.updatePrestigeUI();
      if (typeof window.updatePrestigeTree === 'function') window.updatePrestigeTree();
      
      sauvegarderJeu();
      updateRebirthUI();
    }
  });

})();
