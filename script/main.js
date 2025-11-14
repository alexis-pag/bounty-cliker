/* main.js
   - handles click interaction, counters, particles, save/load, reset
   - relies on window.storeItemsData and window.boostsData (from shop.js / boosts.js)
*/

(() => {
  // particles
  const particlesContainer = document.querySelector('.particles');
  function spawnParticle(i){
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random()*10;
    p.style.width = p.style.height = size+'px';
    p.style.left = Math.random()*100 + '%';
    p.style.background = `rgba(255,255,255, ${0.05 + Math.random()*0.6})`;
    p.style.animationDelay = (Math.random()*8)+'s';
    particlesContainer.appendChild(p);
  }
  for(let i=0;i<26;i++) spawnParticle(i);

  // elements
  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const clickSound = document.getElementById('clickSound');
  const resetButton = document.getElementById('resetButton');

  // game state defaults (will be overwritten by shop.js if loaded)
  window.BountyGame = window.BountyGame || {};
  if(window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if(window.BountyGame.multiplier === undefined) window.BountyGame.multiplier = 1;

  // image pool and image change
  const images = [
    'image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg',
    'image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg',
    'image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'
  ];
  let lastImg = -1;
  function pickRandomIndex(){
    let idx;
    do{ idx = Math.floor(Math.random()*images.length);} while(idx === lastImg);
    return idx;
  }
  function changerImage(){
    const idx = pickRandomIndex();
    imgEl.src = images[idx];
    lastImg = idx;
  }

  // sound
  function jouerSon(){
    try{ clickSound.currentTime = 0; clickSound.volume = 0.9; clickSound.play(); } catch(e){}
  }

  // +1 animation
  function afficherPlusUn(x, y, value){
    const el = document.createElement('div');
    el.className = 'plus-one';
    el.textContent = `+${Math.floor(value)}`;
    document.body.appendChild(el);
    el.style.left = (x - 10) + 'px';
    el.style.top = (y - 20) + 'px';
    setTimeout(()=>el.remove(), 950);
  }

  // CPS calculation
  function calculCPS(){
    let total = 0;
    const items = window.storeItemsData || [];
    const boosts = window.boostsData || [];
    items.forEach(it=>{
      if(it.auto > 0 && it.owned > 0){
        let gain = it.auto * it.owned;
        if(boosts[1] && boosts[1].active) gain *= 2; // employés
        if(boosts[4] && boosts[4].active) gain *= 1.05; // taxes
        total += gain;
      }
    });
    return total;
  }

  // update counters in DOM
  function updateCounterUI(){
    counterEl.textContent = `Croquettes : ${Math.floor(window.BountyGame.count)} (x${window.BountyGame.multiplier})`;
    const cps = calculCPS();
    cpsEl.textContent = `CPS : ${Math.floor(cps)}`;
  }

  // save/load
  function sauvegarderJeu(){
    const save = {
      count: window.BountyGame.count,
      multiplier: window.BountyGame.multiplier,
      storeItems: (window.storeItemsData || []).map(it => ({owned: it.owned, price: it.price})),
      boosts: (window.boostsData || []).map(b => ({active: b.active}))
    };
    localStorage.setItem('bountySave', JSON.stringify(save));
  }

  function chargerJeu(){
    const raw = localStorage.getItem('bountySave');
    if(!raw) return;
    try{
      const data = JSON.parse(raw);
      window.BountyGame.count = data.count ?? window.BountyGame.count;
      window.BountyGame.multiplier = data.multiplier ?? window.BountyGame.multiplier;
      if(Array.isArray(data.storeItems) && Array.isArray(window.storeItemsData)){
        data.storeItems.forEach((s,i)=>{
          if(window.storeItemsData[i]){
            window.storeItemsData[i].owned = s.owned ?? window.storeItemsData[i].owned;
            window.storeItemsData[i].price = s.price ?? window.storeItemsData[i].price;
          }
        });
      }
      if(Array.isArray(data.boosts) && Array.isArray(window.boostsData)){
        data.boosts.forEach((b,i)=>{
          if(window.boostsData[i]) window.boostsData[i].active = !!b.active;
        });
      }
    }catch(e){ console.warn('Erreur lecture sauvegarde',e) }
  }

  // click handler
  let lastClickTime = 0;
  function clicBounty(event){
    const now = Date.now();
    if(now - lastClickTime < 220) return; // anti-spam
    lastClickTime = now;

    let bonus = window.BountyGame.multiplier || 1;
    // consider boosts
    const boosts = window.boostsData || [];
    if(boosts[0] && boosts[0].active) bonus *= 1.5; // bounty doré
    if(boosts[2] && boosts[2].active){
      if(Math.random() < 0.5) bonus = 0;
      else bonus *= 2;
    }
    window.BountyGame.count += bonus;

    afficherPlusUn(event.clientX, event.clientY, bonus);
    changerImage();
    jouerSon();
    updateCounterUI();
    if(window.updateStore) window.updateStore();
    sauvegarderJeu();
  }

  // reset
  function resetJeu(){
    if(!confirm('Réinitialiser le jeu ?')) return;
    // reset global
    window.BountyGame.count = 0;
    window.BountyGame.multiplier = 1;
    // reset items
    (window.storeItemsData||[]).forEach(it=>{
      it.owned = 0;
      it.price = it.basePrice ?? it.price;
    });
    // reset boosts
    (window.boostsData||[]).forEach(b=> b.active = false);
    sauvegarderJeu();
    if(window.updateStore) window.updateStore();
    if(window.afficherBoosts) window.afficherBoosts();
    updateCounterUI();
  }

  // CPS automatic collection
  setInterval(()=>{
    const items = window.storeItemsData || [];
    const boosts = window.boostsData || [];
    items.forEach(it=>{
      if(it.auto > 0 && it.owned > 0){
        let gain = it.auto * it.owned;
        if(boosts[1] && boosts[1].active) gain *= 2;
        if(boosts[4] && boosts[4].active) gain *= 1.05;
        window.BountyGame.count += gain;
      }
    });
    updateCounterUI();
    if(window.updateStore) window.updateStore();
  }, 1000);

  // periodic save
  setInterval(sauvegarderJeu, 60000);

  // Expose functions and init
  window.clicBounty = clicBounty;
  document.getElementById('image').addEventListener('click', clicBounty);
  resetButton.addEventListener('click', resetJeu);

  // load saved data when shop & boosts may not yet exist: delay small timeout
  window.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(()=>{
      chargerJeu();
      if(window.updateStore) window.updateStore();
      if(window.afficherBoosts) window.afficherBoosts();
      updateCounterUI();
    }, 80);
  });

  // image initial
  changerImage();
})();
