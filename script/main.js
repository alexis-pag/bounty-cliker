import { auth, db } from './auth.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

(() => {
  window.BountyGame = window.BountyGame || {};
  if (window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if (window.BountyGame.clickValue === undefined) window.BountyGame.clickValue = 1;
  if (window.BountyGame.addClickBonus === undefined) window.BountyGame.addClickBonus = 0; 
  if (window.BountyGame.addCageBonus === undefined) window.BountyGame.addCageBonus = 0;  
  if (window.BountyGame.cps === undefined) window.BountyGame.cps = 0;
  if (window.BountyGame.rebirths === undefined) window.BountyGame.rebirths = 0;
  if (window.BountyGame.rebirthBonusClick === undefined) window.BountyGame.rebirthBonusClick = 0;
  if (window.BountyGame.rebirthBonusCPS === undefined) window.BountyGame.rebirthBonusCPS = 0;
  if (window.BountyGame.rebirthPrice === undefined) window.BountyGame.rebirthPrice = 1_000_000;

  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const resetButton = document.getElementById('resetButton');
  const clickSound = document.getElementById('clickSound');
  const storeDiv = document.getElementById('storeItems');
  const boostsDiv = document.getElementById('boostsContainer');

  const images = [
    'image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg',
    'image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg',
    'image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'
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
      try { if (clickSound) { clickSound.currentTime = 0; clickSound.volume = 0.9; clickSound.play(); } } catch(e){}

      let bonus = window.BountyGame.multiplier ?? 1;
      const boosts = window.boostsData || [];
      if (boosts[0] && boosts[0].active) bonus *= 1.5;
      if (boosts[2] && boosts[2].active) {
        if (Math.random() < 0.5) bonus = 0;
        else bonus *= 2;
      }
      if (boosts[5] && boosts[5].active) bonus *= 1.10;
      if (boosts[8] && boosts[8].active) bonus *= 2;

      const baseClick = (window.BountyGame.clickValue || 1) + (window.BountyGame.addClickBonus || 0) + (window.BountyGame.addCageBonus || 0) + (window.BountyGame.rebirthBonusClick || 0);
      let gain = baseClick * (bonus || 1);

      window.BountyGame.count += gain;

      spawnPlusOne(ev.clientX, ev.clientY, gain);
      changerImage();

      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.sauvegarderJeu === 'function') window.sauvegarderJeu();
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
      storeItems: (window.storeItemsData || []).map(it=>({ owned: it.owned, price: it.price })),
      boosts: (window.boostsData || []).map(b=>({ active: !!b.active, permanent: !!b.permanent }))
    };

    localStorage.setItem('bountySave', JSON.stringify(data));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), data);
      } catch(e) { console.error("Erreur Firestore save:", e); }
    }
  }
  window.sauvegarderJeu = sauvegarderJeu;

  async function chargerJeu(){
    let data = {};
    const raw = localStorage.getItem('bountySave');
    if (raw) {
      try { data = JSON.parse(raw); } catch(e){ data = {}; }
    }

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) data = docSnap.data();
      } catch(e) { console.error("Erreur Firestore load:", e); }
    }

    window.BountyGame.count = data.count ?? window.BountyGame.count;
    window.BountyGame.multiplier = data.multiplier ?? window.BountyGame.multiplier ?? 1;
    window.BountyGame.clickValue = data.clickValue ?? window.BountyGame.clickValue;
    window.BountyGame.addClickBonus = data.addClickBonus ?? window.BountyGame.addClickBonus;
    window.BountyGame.addCageBonus = data.addCageBonus ?? window.BountyGame.addCageBonus;
    window.BountyGame.cps = data.cps ?? window.BountyGame.cps;

    window.BountyGame.rebirths = data.rebirths ?? window.BountyGame.rebirths;
    window.BountyGame.rebirthPrice = data.rebirthPrice ?? window.BountyGame.rebirthPrice;
    applyRebirthBonus();

    if (Array.isArray(data.storeItems) && Array.isArray(window.storeItemsData)) {
      data.storeItems.forEach((s,i) => {
        if (window.storeItemsData[i]) {
          window.storeItemsData[i].owned = s.owned ?? window.storeItemsData[i].owned;
          window.storeItemsData[i].price = s.price ?? window.storeItemsData[i].price;
        }
      });
    }
    if (Array.isArray(data.boosts) && Array.isArray(window.boostsData)) {
      data.boosts.forEach((b,i) => {
        if (window.boostsData[i]) {
          window.boostsData[i].active = !!b.active;
          window.boostsData[i].permanent = !!b.permanent;
          if (window.boostsData[i].permanent) window.boostsData[i].available = false;
        }
      });
    }
  }
  window.chargerJeu = chargerJeu;

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
      window.BountyGame.count = 0;
      window.BountyGame.multiplier = 1;
      window.BountyGame.clickValue = 1;
      window.BountyGame.addClickBonus = 0;
      window.BountyGame.addCageBonus = 0;
      window.BountyGame.cps = 0;
      (window.storeItemsData || []).forEach(it => { it.owned = 0; it.price = it.basePrice ?? it.price; });
      (window.boostsData || []).forEach(b => { b.active = false; b.available = false; });
      applyRebirthBonus();
      sauvegarderJeu();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      updateCounterUI();
      updateRebirthUI();
    });
  }

  function applyRebirthBonus(){
    window.BountyGame.rebirthBonusClick = (window.BountyGame.rebirths || 0) * 1;
    window.BountyGame.rebirthBonusCPS = (window.BountyGame.rebirths || 0) * 0.2;
  }
  applyRebirthBonus();

  function ensureRebirthUI(){
    if (document.getElementById('rebirthContainer')) return document.getElementById('rebirthContainer');
    const container = document.createElement('div');
    container.id = 'rebirthContainer';
    container.style.position = 'absolute';
    container.style.left = '20px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.zIndex = 10;
    document.body.appendChild(container);
    const btn = document.createElement('button');
    btn.id = 'rebirthButton';
    btn.className = 'btn reset';
    btn.style.width = '140px';
    container.appendChild(btn);
    const info = document.createElement('div');
    info.id = 'rebirthInfo';
    info.style.color = '#fff';
    info.style.fontWeight = '700';
    info.textContent = 'Rebirths : 0';
    container.appendChild(info);
    return container;
  }

  const rebirthUI = ensureRebirthUI();
  const rebirthBtn = document.getElementById('rebirthButton');
  const rebirthInfo = document.getElementById('rebirthInfo');

  function updateRebirthUI(){
    if (!rebirthBtn || !rebirthInfo) return;
    rebirthInfo.textContent = `Rebirths : ${window.BountyGame.rebirths || 0}`;
    rebirthBtn.textContent = `Rebirth (${(window.BountyGame.rebirthPrice || 0).toLocaleString()})`;
    rebirthBtn.disabled = window.BountyGame.count < (window.BountyGame.rebirthPrice || 0);
  }

  if (rebirthBtn) {
    rebirthBtn.addEventListener('click', () => {
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
      (window.boostsData || []).forEach(b => { b.active = false; b.available = false; });
      applyRebirthBonus();
      window.BountyGame.rebirthPrice += 2_000_000;
      updateCounterUI();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      sauvegarderJeu();
      updateRebirthUI();
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
      await chargerJeu();
      if (typeof window.updateStore === 'function') window.updateStore();
      if (typeof window.afficherBoosts === 'function') window.afficherBoosts();
      applyRebirthBonus();
      updateCounterUI();
      updateRebirthUI();
      changerImage();
    }, 60);
  });

  setInterval(sauvegarderJeu, 60000);
  window.updateRebirthUI = updateRebirthUI;
  window.applyRebirthBonus = applyRebirthBonus;
})();
