// main.js
(() => {
  window.BountyGame = window.BountyGame || {};
  if (window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if (window.BountyGame.multiplier === undefined) window.BountyGame.multiplier = 1;

  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const resetButton = document.getElementById('resetButton');
  const clickSound = document.getElementById('clickSound');
  const shopPanel = document.querySelector('.shop');
  const shopHeader = shopPanel.querySelector('.panel-header');

  // play sound
  function jouerSon(){ try{ clickSound.currentTime=0; clickSound.volume=0.9; clickSound.play(); } catch(e){} }

  // image random click
  const images = ['image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg','image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg','image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'];
  let lastIndex=-1;
  function changerImage(){ let idx; do{ idx=Math.floor(Math.random()*images.length); }while(idx===lastIndex); lastIndex=idx; imgEl.src=images[idx]; }

  // +1 visual
  function afficherPlusUn(x,y,value){ const el=document.createElement('div'); el.className='plus-one'; el.textContent=`+${Math.floor(value)}`; document.body.appendChild(el); el.style.left=Math.min(window.innerWidth-40,Math.max(8,x))+'px'; el.style.top=Math.min(window.innerHeight-40,Math.max(8,y))+'px'; setTimeout(()=>el.remove(),950); }

  // clicker
  imgEl.addEventListener('click',(ev)=>{
    let bonus=window.BountyGame.multiplier||1;
    const items=window.storeItemsData||[];
    items.forEach(it=>{ if(it.owned && it.mult>0) bonus+=it.mult*it.owned; });
    window.BountyGame.count+=bonus;
    afficherPlusUn(ev.clientX,ev.clientY,bonus);
    changerImage();
    jouerSon();
    updateCounterUI();
    if(window.updateStore) window.updateStore();
    if(window.sauvegarderJeu) window.sauvegarderJeu();
  });

  function calculCPS(){ let total=0; const items=window.storeItemsData||[]; items.forEach(it=>{ if(it.auto>0 && it.owned>0) total+=it.auto*it.owned; }); return total; }

  function updateCounterUI(){ counterEl.textContent=`Croquettes : ${Math.floor(window.BountyGame.count)} (x${window.BountyGame.multiplier})`; cpsEl.textContent=`CPS : ${Math.floor(calculCPS())}`; }
  window.updateCounterUI=updateCounterUI;

  // CPS income
  setInterval(()=>{
    const items=window.storeItemsData||[];
    items.forEach(it=>{ if(it.auto>0 && it.owned>0) window.BountyGame.count+=it.auto*it.owned; });
    updateCounterUI();
    if(window.updateStore) window.updateStore();
  },1000);

  // save/load
  function sauvegarderJeu(){ const data={count:window.BountyGame.count,multiplier:window.BountyGame.multiplier,storeItems:(window.storeItemsData||[]).map(it=>({owned:it.owned,price:it.price}))}; localStorage.setItem('bountySave',JSON.stringify(data)); }
  window.sauvegarderJeu=sauvegarderJeu;

  function chargerJeu(){
    const raw=localStorage.getItem('bountySave');
    if(!raw) return;
    try{
      const data=JSON.parse(raw);
      window.BountyGame.count=data.count??window.BountyGame.count;
      window.BountyGame.multiplier=data.multiplier??window.BountyGame.multiplier;
      if(Array.isArray(data.storeItems)&&Array.isArray(window.storeItemsData)){
        data.storeItems.forEach((s,i)=>{ if(window.storeItemsData[i]){ window.storeItemsData[i].owned=s.owned??window.storeItemsData[i].owned; window.storeItemsData[i].price=s.price??window.storeItemsData[i].price; } });
      }
    }catch(e){console.warn("Load error",e);}
  }
  window.chargerJeu=chargerJeu;

  // reset
  resetButton.addEventListener('click',()=>{
    if(!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
    window.BountyGame.count=0;
    window.BountyGame.multiplier=1;
    (window.storeItemsData||[]).forEach(it=>{ it.owned=0; it.price=it.basePrice??it.price; });
    sauvegarderJeu();
    if(window.updateStore) window.updateStore();
    updateCounterUI();
  });

  // boutique toggle
  shopHeader.addEventListener('click',()=>{ shopPanel.classList.toggle('open'); });

  // initial load
  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>{ chargerJeu(); if(window.updateStore) window.updateStore(); updateCounterUI(); changerImage(); },60); });

  // periodic save
  setInterval(sauvegarderJeu,60000);
})();
