/* main.js
   - click, +1/+5, cps, save/load, reset
   - menu déroulant boutique intégré
*/
(() => {
  // Ensure shared object
  window.BountyGame = window.BountyGame || {};
  if (window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if (window.BountyGame.multiplier === undefined) window.BountyGame.multiplier = 1;

  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const resetButton = document.getElementById('resetButton');
  const clickSound = document.getElementById('clickSound');

  // helper: play sound safely
  function jouerSon(){
    try{ clickSound.currentTime = 0; clickSound.volume = 0.9; clickSound.play(); } catch(e){}
  }

  // change image for click feedback (random)
  const images = [
    'image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg',
    'image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg',
    'image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'
  ];
  let lastIndex = -1;
  function changerImage(){
    let idx;
    do { idx = Math.floor(Math.random() * images.length); } while (idx === lastIndex);
    lastIndex = idx;
    imgEl.src = images[idx];
  }

  // +1/+X visual
  function afficherPlusUn(x, y, value){
    const el = document.createElement('div');
    el.className = 'plus-one';
    el.textContent = `+${Math.floor(value)}`;
    document.body.appendChild(el);
    const left = Math.min(window.innerWidth - 40, Math.max(8, x));
    const top = Math.min(window.innerHeight - 40, Math.max(8, y));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    setTimeout(()=>el.remove(), 950);
  }

  // click handler
  let lastClickTime = 0;
  imgEl.addEventListener('click', (ev) => {
    const now = Date.now();
    if (now - lastClickTime < 180) return;
    lastClickTime = now;

    let bonus = window.BountyGame.multiplier || 1;

    // Appliquer les multiplicateurs des 2 premiers items du shop
    const items = window.storeItemsData || [];
    if(items[0] && items[0].owned > 0) bonus += items[0].mult * items[0].owned; // Gamelle +1
    if(items[1] && items[1].owned > 0) bonus += items[1].mult * items[1].owned; // Cage +5

    window.BountyGame.count += bonus;

    afficherPlusUn(ev.clientX, ev.clientY, bonus);
    changerImage();
    jouerSon();
    updateCounterUI();
    if (window.updateStore) window.updateStore();
    if (window.sauvegarderJeu) window.sauvegarderJeu();
  });

  // CPS calculation
  function calculCPS(){
    let total = 0;
    const items = window.storeItemsData || [];
    const boosts = window.boostsData || [];
    items.forEach(it => {
      if(it.auto>0 && it.owned>0){
        let gain = it.auto * it.owned;
        total += gain;
      }
    });
    return total;
  }

  function updateCounterUI(){
    counterEl.textContent = `Croquettes : ${Math.floor(window.BountyGame.count)} (x${window.BountyGame.multiplier})`;
    cpsEl.textContent = `CPS : ${Math.floor(calculCPS())}`;
  }
  window.updateCounterUI = updateCounterUI;

  // automatic CPS income
  setInterval(() => {
    const items = window.storeItemsData || [];
    items.forEach(it => {
      if(it.auto>0 && it.owned>0){
        let gain = it.auto * it.owned;
        window.BountyGame.count += gain;
      }
    });
    updateCounterUI();
    if (window.updateStore) window.updateStore();
  },1000);

  // save/load
  function sauvegarderJeu(){
    const data = {
      count: window.BountyGame.count,
      multiplier: window.BountyGame.multiplier,
      storeItems: (window.storeItemsData||[]).map(it=>({owned:it.owned,price:it.price}))
    };
    localStorage.setItem('bountySave',JSON.stringify(data));
  }
  window.sauvegarderJeu = sauvegarderJeu;

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
    }catch(e){ console.warn("Load error", e); }
  }
  window.chargerJeu = chargerJeu;

  // reset
  resetButton.addEventListener('click', ()=>{
    if(!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
    window.BountyGame.count = 0;
    window.BountyGame.multiplier = 1;
    (window.storeItemsData||[]).forEach(it=>{ it.owned=0; it.price=it.basePrice??it.price; });
    sauvegarderJeu();
    if(window.updateStore) window.updateStore();
    updateCounterUI();
  });

  // Menu déroulant boutique
  const shopPanel = document.querySelector('.shop');
  const shopHeader = shopPanel.querySelector('.panel-header');
  shopHeader.addEventListener('click', ()=>{ shopPanel.classList.toggle('open'); });
  shopPanel.classList.remove('open'); // fermé au départ

  // Initial load
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      chargerJeu();
      if(window.updateStore) window.updateStore();
      updateCounterUI();
      changerImage();
    },60);
  });

  // periodic save
  setInterval(sauvegarderJeu,60000);

})();
