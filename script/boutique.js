(() => {
  window.storeItemsData = [
    { name: "Gamelle de croquette", price: 10, mult: 0, auto: 0, owned: 0, icon: "script/image/gamelle.png", bonusClick: 1 },
    { name: "Cage à croquette", price: 50, mult: 0, auto: 0, owned: 0, icon: "script/image/cage.png", bonusClick: 5 },
    { name: "Paquet de croquette", price: 100, mult: 0, auto: 1, owned: 0, icon: "script/image/paquet.png" },
    { name: "Magasin de croquettes", price: 500, mult: 0, auto: 5, owned: 0, icon: "script/image/magasin.png" },
    { name: "Supermarcher de croquette", price: 1000, mult: 0, auto: 10, owned: 0, icon: "script/image/supermarche.png" },
    { name: "Hypermarcher de croquettes", price: 2000, mult: 0, auto: 20, owned: 0, icon: "script/image/hypermarcher.png" },
    { name: "Entrepot de croquettes", price: 10000, mult: 0, auto: 50, owned: 0, icon: "script/image/entrepot.png" },
    { name: "Usine de croquettes", price: 100000, mult: 0, auto: 100, owned: 0, icon: "script/image/usine.png" },
    { name: "Temple à croquettes", price: 500000, mult: 0, auto: 300, owned: 0, icon: "script/image/temple.png" },
    { name: "Dimension de croquettes", price: 500000, mult: 0, auto: 500, owned: 0, icon: "script/image/dimension.png" },
    { name: "Univers de croquettes", price: 1000000, mult: 0, auto: 1000, owned: 0, icon: "script/image/univers.png" },
    { name: "Galaxy de croquettes", price: 5000000, mult: 0, auto: 5000, owned: 0, icon: "script/image/galaxy.png" }
  ];

  // initialisation basePrice
  window.storeItemsData.forEach(it => { if (it.basePrice === undefined) it.basePrice = it.price; });

  // initialisation BountyGame si nécessaire
  window.BountyGame = window.BountyGame || {};
  window.BountyGame.count = window.BountyGame.count || 0;
  window.BountyGame.multiplier = window.BountyGame.multiplier || 1;
  window.BountyGame.bonusClick = 0;

  const storeDiv = document.getElementById('storeItems');

  function renderItem(item, idx) {
    const root = document.createElement('div');
    root.className = 'item';

    const left = document.createElement('div'); left.className = 'left';
    const img = document.createElement('img'); img.className = 'icon'; img.src = item.icon;
    const txt = document.createElement('div'); txt.innerHTML = `<strong>${item.name}</strong><div style="font-size:12px;color:rgba(255,255,255,0.7)">Prix: ${Math.floor(item.price)}</div>`;
    left.appendChild(img); left.appendChild(txt);

    const right = document.createElement('div');
    const btn = document.createElement('button'); btn.className = 'btn buy'; btn.textContent = 'Acheter';
    btn.disabled = !(window.BountyGame && window.BountyGame.count >= item.price);
    btn.addEventListener('click', (e) => { e.stopPropagation(); acheterItem(idx); });

    // --- TOOLTIP ANIMÉ AU-DESSUS ---
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    if (item.bonusClick) tooltip.textContent = `+${item.bonusClick} par clic !`;
    else if (item.mult > 0) tooltip.textContent = `+${item.mult} multiplicateur !`;
    else tooltip.textContent = `+${item.auto} auto-croquettes !`;
    btn.appendChild(tooltip);
    // ------------------------------

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

      // --- Bonus par clic pour Gamelle / Cage ---
      if (item.bonusClick) {
        window.BountyGame.bonusClick += item.bonusClick;
      }

      // Multiplicateur normal
      if (item.mult > 0) window.BountyGame.multiplier += item.mult;

      item.owned += 1;
      item.price = Math.round(item.price * 1.40);

      // purchase flash
      const node = storeDiv.children[idx];
      const flash = document.createElement('div'); flash.className = 'boost-appear';
      flash.style.position = 'absolute'; flash.style.inset = '0';
      node.appendChild(flash); setTimeout(()=>flash.remove(), 420);

      if (window.updateCounterUI) window.updateCounterUI();
      if (window.sauvegarderJeu) window.sauvegarderJeu();
      updateStore();
    } else {
      // not enough
      const old = document.body.style.filter;
      document.body.style.filter = 'brightness(.85)';
      setTimeout(()=>document.body.style.filter = old, 220);
    }
  }

  window.updateStore = updateStore;
  window.acheterItem = acheterItem;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => updateStore(), 40);

    // clic principal sur l'image
    const img = document.getElementById('image');
    if (img) {
      img.addEventListener('click', () => {
        const gain = 1 + (window.BountyGame.bonusClick || 0);
        window.BountyGame.count += gain;
        if (window.updateCounterUI) window.updateCounterUI();
      });
    }
  });
})();
