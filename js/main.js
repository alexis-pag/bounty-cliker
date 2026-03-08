// script/main.js
import { checkAuth, logout } from './auth.js';
import { loadUserData, saveUserData, syncCorrectionToFirebase } from './database.js';
import { ClickDetection } from './click-detection.js';
import { AutoclickProtection } from './autoclick-protection.js';

(() => {
  window.BountyGame = window.BountyGame || {};
  let currentUser = null;
  let currentUsername = null;

  // Initialisation du système de protection
  const detector = new ClickDetection(25, 1000); // 25 CPS threshold
  const protection = new AutoclickProtection();

  window.onAutoClickUnlock = () => {
    detector.reset();
  };

  // Initialisation des variables de jeu par défaut
  const defaultGameState = {
    count: 0,
    multiplier: 1,
    clickValue: 1,
    addClickBonus: 0,
    addCageBonus: 0,
    cps: 0,
    rebirths: 0,
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
    const left = Math.min(window.innerWidth - 60, Math.max(8, x));
    const top = Math.min(window.innerHeight - 40, Math.max(8, y));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 950);
  }

  function updateCounterUI(){
    if (counterEl) counterEl.textContent = `Croquettes : ${Math.floor(window.BountyGame.count)} (×${(window.BountyGame.multiplier ?? 1)})`;
    if (cpsEl) cpsEl.textContent = `CPS : ${Math.floor(window.BountyGame.cps)}`;
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
        total += gain;
      }
    });

    total += (window.BountyGame.rebirthBonusCPS || 0);
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
      const clickValue = Number(window.BountyGame.clickValue) || 1;
      const addClickBonus = Number(window.BountyGame.addClickBonus) || 0;
      const addCageBonus = Number(window.BountyGame.addCageBonus) || 0;
      const rebirthBonusClick = Number(window.BountyGame.rebirthBonusClick) || 0;

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

      const baseClick = clickValue + addClickBonus + addCageBonus + rebirthBonusClick;
      const gain = Math.max(1, baseClick * bonus);

      // Enregistrer le clic avec son gain potentiel et vérifier si c'est anormal
      detector.recordClick(gain);
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

      spawnPlusOne(ev.clientX, ev.clientY, gain);
      changerImage();
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
    });
  }

  setInterval(() => {
    const cpsGain = calculCPS();
    window.BountyGame.count += cpsGain;
    window.BountyGame.cps = cpsGain;
    updateCounterUI();
    if (typeof window.updateStore === 'function') window.updateStore();
  }, 1000);

  async function sauvegarderJeu(){
    if (!currentUser) return;
    const data = {
      count: window.BountyGame.count,
      multiplier: window.BountyGame.multiplier ?? 1,
      clickValue: window.BountyGame.clickValue,
      addClickBonus: window.BountyGame.addClickBonus,
      addCageBonus: window.BountyGame.addCageBonus,
      cps: window.BountyGame.cps,
      rebirths: window.BountyGame.rebirths,
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
      if (!fullData || !fullData.gameData) {
        console.log("Nouvel utilisateur, initialisation par défaut.");
        return;
      }
      
      const data = fullData.gameData;
      if (fullData.profile) {
        currentUsername = fullData.profile.username || fullData.profile.email?.split('@')[0] || "Anonyme";
      }
      
      // Mise à jour de l'état global
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
      if (!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
      Object.assign(window.BountyGame, defaultGameState);
      (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
      (window.boostsData || []).forEach(b => { b.active = false; b.available = false; b.permanent = false; });
      applyRebirthBonus();
      await sauvegarderJeu();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      updateCounterUI();
      if (typeof window.updateRebirthUI === 'function') window.updateRebirthUI();
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
  }

  function updateRebirthUI(){
    const rebirthBtn = document.getElementById('rebirthButton');
    const rebirthInfo = document.getElementById('rebirthInfo');
    if (!rebirthBtn || !rebirthInfo) return;
    rebirthInfo.textContent = `Rebirths : ${window.BountyGame.rebirths || 0}`;
    rebirthBtn.textContent = `Rebirth (${(window.BountyGame.rebirthPrice || 0).toLocaleString()})`;
    rebirthBtn.disabled = window.BountyGame.count < (window.BountyGame.rebirthPrice || 0);
  }
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
    
    // Auto-save toutes les 10 secondes
    setInterval(sauvegarderJeu, 10000);

    // Enlever le flash (FOUC)
    document.querySelector('.layout')?.classList.add('loaded');
  });

  // Export logout to window for buttons
  window.logout = logout;

  // Event listener for rebirth button if it exists
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'rebirthButton') {
      const price = window.BountyGame.rebirthPrice || 1000000;
      if (window.BountyGame.count < price) return alert(`Il faut ${price.toLocaleString()} croquettes pour rebirth.`);
      if (!confirm(`Faire un Rebirth pour ${price.toLocaleString()} croquettes ?`)) return;

      window.BountyGame.rebirths += 1;
      window.BountyGame.count = 0;
      window.BountyGame.clickValue = 1;
      window.BountyGame.addClickBonus = 0;
      window.BountyGame.addCageBonus = 0;
      window.BountyGame.cps = 0;
      (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
      (window.boostsData || []).forEach(b => { b.active = false; b.available = false; b.permanent = false; });
      applyRebirthBonus();
      window.BountyGame.rebirthPrice += 2_000_000;
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      sauvegarderJeu();
      updateRebirthUI();
    }
  });

})();
