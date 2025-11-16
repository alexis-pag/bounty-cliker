(() => {
  // Variables principales
  window.BountyGame = window.BountyGame || {};
  if (window.BountyGame.count === undefined) window.BountyGame.count = 0;
  if (window.BountyGame.clickValue === undefined) window.BountyGame.clickValue = 1;
  if (window.BountyGame.addClickBonus === undefined) window.BountyGame.addClickBonus = 0;
  if (window.BountyGame.addCageBonus === undefined) window.BountyGame.addCageBonus = 0;

  const counter = document.getElementById("counter");
  const cpsDisplay = document.getElementById("cps");
  const img = document.getElementById("image");
  const clickSound = document.getElementById("clickSound");
  const storeItemsDiv = document.getElementById("storeItems");
  const resetButton = document.getElementById("resetButton");

  // Shop toggle
  const shopPanel = document.querySelector('.shop');
  const shopHeader = shopPanel.querySelector('.panel-header');
  shopHeader.addEventListener('click', () => shopPanel.classList.toggle('open'));
  shopPanel.classList.remove('open'); // fermé au départ

  // Plus-one animation
  function spawnPlusOne(x, y, gain){
    const p = document.createElement("div");
    p.className = "plus-one";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.textContent = "+" + gain;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }

  // Update UI
  function updateUI(){
    counter.textContent = "Croquettes : " + Math.floor(window.BountyGame.count);
    cpsDisplay.textContent = "CPS : 0";
    renderStore();
  }

  // Click handler
  img.addEventListener('click', (e)=>{
    clickSound.currentTime = 0; clickSound.play();
    let gain = window.BountyGame.clickValue + window.BountyGame.addClickBonus + window.BountyGame.addCageBonus;
    window.BountyGame.count += gain;
    spawnPlusOne(e.clientX, e.clientY, gain);
    updateUI();
    saveGame();
  });

  // Store items
  const storeItemsData = [
    { name: "Gamelle de croquette", price: 10, bonusClick: 1, auto: 0, owned: 0 },
    { name: "Cage à croquette", price: 50, bonusClick: 5, auto: 0, owned: 0 },
    { name: "Paquet de croquette", price: 100, bonusClick: 0, auto: 1, owned: 0 }
  ];

  function renderStore(){
    storeItemsDiv.innerHTML = "";
    storeItemsData.forEach((item, idx)=>{
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<strong>${item.name}</strong> <div>Prix: ${item.price}</div>`;
      const btn = document.createElement("button");
      btn.className = "btn buy";
      btn.textContent = "Acheter";
      btn.disabled = window.BountyGame.count < item.price;
      btn.addEventListener("click", ()=>{
        if(window.BountyGame.count >= item.price){
          window.BountyGame.count -= item.price;
          if(item.bonusClick){
            if(item.name === "Gamelle de croquette") window.BountyGame.addClickBonus += item.bonusClick;
            if(item.name === "Cage à croquette") window.BountyGame.addCageBonus += item.bonusClick;
          }
          item.owned++;
          item.price = Math.round(item.price * 1.4);
          updateUI();
          saveGame();
        }
      });
      div.appendChild(btn);
      storeItemsDiv.appendChild(div);
    });
  }

  // Save/load
  function saveGame(){
    const data = {
      count: window.BountyGame.count,
      clickValue: window.BountyGame.clickValue,
      addClickBonus: window.BountyGame.addClickBonus,
      addCageBonus: window.BountyGame.addCageBonus,
      storeItemsData
    };
    localStorage.setItem("bountySave", JSON.stringify(data));
  }

  function loadGame(){
    const data = JSON.parse(localStorage.getItem("bountySave"));
    if(!data) return;
    window.BountyGame.count = data.count ?? window.BountyGame.count;
    window.BountyGame.clickValue = data.clickValue ?? window.BountyGame.clickValue;
    window.BountyGame.addClickBonus = data.addClickBonus ?? window.BountyGame.addClickBonus;
    window.BountyGame.addCageBonus = data.addCageBonus ?? window.BountyGame.addCageBonus;
    if(data.storeItemsData){
      data.storeItemsData.forEach((item, i)=>{
        if(storeItemsData[i]){
          storeItemsData[i].owned = item.owned ?? storeItemsData[i].owned;
          storeItemsData[i].price = item.price ?? storeItemsData[i].price;
        }
      });
    }
  }

  // Reset
  resetButton.addEventListener('click', ()=>{
    if(!confirm("Réinitialiser le jeu ?")) return;
    window.BountyGame.count = 0;
    window.BountyGame.clickValue = 1;
    window.BountyGame.addClickBonus = 0;
    window.BountyGame.addCageBonus = 0;
    storeItemsData.forEach(it => { it.owned = 0; it.price = it.price; });
    updateUI();
    saveGame();
  });

  // Auto CPS placeholder
  setInterval(()=>{ updateUI(); saveGame(); }, 1000);

  // Initial load
  document.addEventListener('DOMContentLoaded', ()=>{
    loadGame();
    updateUI();
  });
})();
