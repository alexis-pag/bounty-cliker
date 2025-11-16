(() => {
  window.storeItemsData = [
    // ITEMS CLIQUE (bonusClick)
    { name: "Gamelle de croquette", price: 15, bonusClick: 1, auto: 0, owned: 0, icon: "script/image/gamelle.png" },
    { name: "Cage à croquette", price: 65, bonusClick: 5, auto: 0, owned: 0, icon: "script/image/cage.png" },

    // ITEMS CPS (auto)
    { name: "Paquet de croquette", price: 130, auto: 1, owned: 0, icon: "script/image/paquet.png" },
    { name: "Petit sac de croquettes", price: 260, auto: 2, owned: 0, icon: "script/image/petit_sac.png" },
    { name: "Arbre à croquettes", price: 455, auto: 3, owned: 0, icon: "script/image/arbre.png" },
    { name: "Moyen sac de croquettes", price: 650, auto: 5, owned: 0, icon: "script/image/moyen_sac.png" },
    { name: "Grand sac de croquettes", price: 1040, auto: 8, owned: 0, icon: "script/image/grand_sac.png" },
    { name: "Chariot de croquettes", price: 1560, auto: 12, owned: 0, icon: "script/image/chariot.png" },
    { name: "Ferme de croquettes", price: 2600, auto: 20, owned: 0, icon: "script/image/ferme.png" },
    { name: "Chien distributeur", price: 4550, auto: 30, owned: 0, icon: "script/image/chien.png" },

    // BOOSTED CPS pour les 5 derniers items
    { name: "Mini usine de croquettes", price: 6500, auto: 80, owned: 0, icon: "script/image/mini_usine.png" },
    { name: "Usine de croquettes", price: 10400, auto: 120, owned: 0, icon: "script/image/usine.png" },
    { name: "Station de production canine", price: 15600, auto: 180, owned: 0, icon: "script/image/station.png" },
    { name: "Machine à croquettes automatique", price: 26000, auto: 300, owned: 0, icon: "script/image/machine.png" },
    { name: "Atelier de croquettes", price: 39000, auto: 450, owned: 0, icon: "script/image/atelier.png" },
    { name: "Fonderie de croquettes", price: 65000, auto: 700, owned: 0, icon: "script/image/fonderie.png" },
    { name: "Chariot volant", price: 97500, auto: 1000, owned: 0, icon: "script/image/chariot_volant.png" },
    { name: "Petit robot distributeur", price: 130000, auto: 1400, owned: 0, icon: "script/image/robot_petit.png" },
    { name: "Robot distributeur avancé", price: 260000, auto: 2500, owned: 0, icon: "script/image/robot_avance.png" },
    { name: "Complexe de distribution", price: 520000, auto: 5000, owned: 0, icon: "script/image/complexe.png" },
    { name: "Tour de croquettes", price: 975000, auto: 10000, owned: 0, icon: "script/image/tour.png" },
    { name: "Temple de croquettes", price: 1300000, auto: 20000, owned: 0, icon: "script/image/temple.png" }
  ];

  // Base price pour reset
  window.storeItemsData.forEach(it => { if (it.basePrice === undefined) it.basePrice = it.price; });

  const storeDiv = document.getElementById('storeItems');

  function renderItem(item, idx) {
    const root = document.createElement('div');
    root.className = 'item';

    const left = document.createElement('div'); left.className = 'left';
    const img = document.createElement('img'); img.className = 'icon'; img.src = item.icon;
    const txt = document.createElement('div');
    txt.innerHTML = `<strong>${item.name}</strong><div style="font-size:12px;color:rgba(255,255,255,0.7)">Prix: ${item.price}</div>`;
    left.appendChild(img); left.appendChild(txt);

    const right = document.createElement('div');
    const btn = document.createElement('button'); btn.className = 'btn buy'; btn.textContent = 'Acheter';
    btn.disabled = !(window.BountyGame && window.BountyGame.count >= item.price);
    btn.addEventListener('click', (e) => { e.stopPropagation(); acheterItem(idx); });

    const tooltip = document.createElement('span'); tooltip.className = 'tooltip';
    if (item.bonusClick) tooltip.textContent = `+${item.bonusClick} par clic !`;
    else if (item.auto) tooltip.textContent = `+${item.auto} auto-croquettes !`;
    btn.appendChild(tooltip);

    right.appendChild(btn);
    const badge = document.createElement('div'); badge.className = 'count-badge'; badge.textContent = item.owned;

    root.appendChild(left); root.appendChild(right); root.appendChild(badge);
    return root;
  }

  function updateStore() {
    storeDiv.innerHTML = '';
    window.storeItemsData.forEach((item, idx) => {
      const node = renderItem(item, idx);
      storeDiv.appendChild(node);
    });
  }

  function acheterItem(idx) {
    const item = window.storeItemsData[idx];
    if (!item) return;
    if (window.BountyGame.count >= item.price) {
      window.BountyGame.count -= item.price;
      if (item.bonusClick) window.BountyGame.multiplier += item.bonusClick;
      item.owned += 1;
      item.price = Math.ceil(item.price * 1.4 / 5) * 5; // arrondi à 5 ou 10

      const node = storeDiv.children[idx];
      const flash = document.createElement('div'); flash.className = 'boost-appear';
      flash.style.position = 'absolute'; flash.style.inset = '0';
      node.appendChild(flash); setTimeout(() => flash.remove(), 420);

      if (window.updateCounterUI) window.updateCounterUI();
      if (window.sauvegarderJeu) window.sauvegarderJeu();
      updateStore();
    } else {
      const old = document.body.style.filter;
      document.body.style.filter = 'brightness(.85)';
      setTimeout(() => document.body.style.filter = old, 220);
    }
  }

  window.updateStore = updateStore;
  window.acheterItem = acheterItem;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => updateStore(), 40);
  });
})();
