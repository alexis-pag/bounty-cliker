(() => {
  window.BountyGame = window.BountyGame || {};
  if (window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if (window.BountyGame.multiplier === undefined) window.BountyGame.multiplier = 1;

  const imgEl = document.getElementById('image');
  const counterEl = document.getElementById('counter');
  const cpsEl = document.getElementById('cps');
  const resetButton = document.getElementById('resetButton');
  const clickSound = document.getElementById('clickSound');

  function jouerSon(){ try{ clickSound.currentTime=0; clickSound.volume=0.9; clickSound.play(); }catch(e){} }

  const images = [
    'image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg',
    'image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg',
    'image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'
  ];
  let lastIndex = -1;
  function changerImage(){ let idx; do { idx = Math.floor(Math.random()*images.length); } while(idx===lastIndex); lastIndex=idx; imgEl.src=images[idx]; }

  function afficherPlusUn(x,y,value){ const el=document.createElement('div'); el.className='plus-one'; el.textContent=`+${Math.floor(value)}`; document.body.appendChild(el); const left=Math.min(window.innerWidth-40,Math.max(8,x)); const top=Math.min(window.innerHeight-40,Math.max(8,y)); el.style.left=left+'px'; el.style.top=top+'px'; setTimeout(()=>el.remove(),950); }

  // ----------------------------
  // calcul du gain par clic
  function getClickGain(){
    let gain = 1;
    const items = window.storeItemsData || [];
    if(items[0]) gain += items[0].owned * (items[0].bonusClick || 0);
    if(items[1]) gain += items[1].owned * (items[1].bonusClick || 0);
    return gain;
  }
  // ----------------------------

  let lastClickTime=0;
  imgEl.addEventListener('click',(ev)=>{
    const now=Date.now(); if(now-lastClickTime<180)return; lastClickTime=now;

    const baseGain = getClickGain();
    let totalGain = baseGain;

    const boosts = window.boostsData || [];
    if(boosts[0] && boosts[0].active) totalGain *= 1.5;
    if(boosts[2] && boosts[2].active){ if(Math.random()<0.5) totalGain=0; else totalGain*=2; }
    if(boosts[5] && boosts[5].active) totalGain*=1.10;
    if(boosts[8] && boosts[8].active) totalGain*=2;

    window.BountyGame.count += totalGain;
    afficherPlusUn(ev.clientX,ev.clientY,totalGain);
    changerImage();
    jouerSon();
    updateCounterUI();
    if(window.updateStore) window.updateStore();
    if(window.sauvegarderJeu) window.sauvegarderJeu();
  });

  function calculCPS(){
    let total=0;
    const items=window.storeItemsData||[];
    const boosts=window.boostsData||[];
    items.forEach(it=>{
      if(it.auto>0 && it.owned>0){
        let gain = it.auto*it.owned;
        if(boosts[1]&&boosts[1].active) gain*=2;
        if(boosts[4]&&boosts[4].active) gain*=1.05;
        total+=gain;
      }
    });
    return total;
  }

  function updateCounterUI(){ counterEl.textContent=`Croquettes : ${Math.floor(window.BountyGame.count)} (x${window.BountyGame.multiplier})`; cpsEl.textContent=`CPS : ${Math.floor(calculCPS())}`; }
  window.updateCounterUI = updateCounterUI;

  setInterval(()=>{
    const items=window.storeItemsData||[];
    const boosts=window.boostsData||[];
    items.forEach(it=>{
      if(it.auto>0 && it.owned>0){
        let gain = it.auto*it.owned;
        if(boosts[1]&&boosts[1].active) gain*=2;
        if(boosts[4]&&boosts[4].active) gain*=1.05;
        window.BountyGame.count += gain;
      }
    });
    updateCounterUI();
    if(window.updateStore) window.updateStore();
  },1000);

  function sauvegarderJeu(){ const data={ count:window.BountyGame.count, multiplier:window.BountyGame.multiplier, storeItems:(window.storeItemsData||[]).map(it=>({owned:it.owned,price:it.price})), boosts:(window.boostsData||[]).map(b=>({active:b.active,permanent:b.permanent})) }; localStorage.setItem('bountySave',JSON.stringify(data)); }
  window.sauvegarderJeu=sauvegarderJeu;

  function chargerJeu(){
    const raw=localStorage.getItem('bountySave'); if(!raw)return;
    try{
      const data=JSON.parse(raw);
      window.BountyGame.count=data.count??window.BountyGame.count;
      window.BountyGame.multiplier=data.multiplier??window.BountyGame.multiplier;
      if(Array.isArray(data.storeItems)&&Array.isArray(window.storeItemsData)){
        data.storeItems.forEach((s,i)=>{
          if(window.storeItemsData[i]){ window.storeItemsData[i].owned=s.owned??window.storeItemsData[i].owned; window.storeItemsData[i].price=s.price??window.storeItemsData[i].price; }
        });
      }
      if(Array.isArray(data.boosts)&&Array.isArray(window.boostsData)){
        data.boosts.forEach((b,i)=>{
          if(window.boostsData[i]){ window.boostsData[i].active=!!b.active; window.boostsData[i].permanent=!!b.permanent; if(window.boostsData[i].permanent) window.boostsData[i].available=false; }
        });
      }
    }catch(e){console.warn("Load error",e);}
  }
  window.chargerJeu=chargerJeu;

  resetButton.addEventListener('click',()=>{
    if(!confirm("Réinitialiser le jeu et supprimer la sauvegarde ?")) return;
    window.BountyGame.count=0;
    window.BountyGame.multiplier=1;
    (window.storeItemsData||[]).forEach(it=>{it.owned=0;it.price=it.basePrice??it.price;});
    (window.boostsData||[]).forEach(b=>{b.active=false;b.available=false;b.permanent=false;});
    sauvegarderJeu();
    if(window.updateStore) window.updateStore();
    if(window.afficherBoosts) window.afficherBoosts();
    updateCounterUI();
  });

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      chargerJeu();
      if(window.updateStore) window.updateStore();
      if(window.afficherBoosts) window.afficherBoosts();
      updateCounterUI();
      changerImage();
    },60);
  });

  setInterval(sauvegarderJeu,60000);
})();
