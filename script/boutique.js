(() => {
  window.storeItemsData = [
    { name: "Gamelle à carottes", price: 15, bonusClick: 1, auto: 0, owned: 0, icon: "script/image/gamelle.png" },
    { name: "Clapier amélioré", price: 65, bonusClick: 5, auto: 0, owned: 0, icon: "script/image/clapier.png" },
    { name: "Botte de carottes", price: 130, bonusClick: 0, auto: 1, owned: 0, icon: "script/image/botte.png" },
    { name: "Petit sac de carottes", price: 260, bonusClick: 0, auto: 2, owned: 0, icon: "script/image/petit_sac.png" },
    { name: "Arbre à carottes", price: 455, bonusClick: 0, auto: 3, owned: 0, icon: "script/image/arbre.png" },
    { name: "Potager du lapin", price: 650, bonusClick: 0, auto: 5, owned: 0, icon: "script/image/potager.png" },
    { name: "Moyen sac de carottes", price: 1040, bonusClick: 0, auto: 8, owned: 0, icon: "script/image/moyen_sac.png" },
    { name: "Grand sac de carottes", price: 1560, bonusClick: 0, auto: 12, owned: 0, icon: "script/image/grand_sac.png" },
    { name: "Chariot à carottes", price: 2600, bonusClick: 0, auto: 20, owned: 0, icon: "script/image/chariot.png" },
    { name: "Ferme de carottes", price: 4550, bonusClick: 0, auto: 30, owned: 0, icon: "script/image/ferme.png" },
    { name: "Lapin cultivateur", price: 6500, bonusClick: 0, auto: 80, owned: 0, icon: "script/image/lapin.png" },
    { name: "Mini usine végétale", price: 10400, bonusClick: 0, auto: 120, owned: 0, icon: "script/image/mini_usine.png" },
    { name: "Usine de carottes", price: 15600, bonusClick: 0, auto: 180, owned: 0, icon: "script/image/usine.png" },
    { name: "Station agricole lapine", price: 26000, bonusClick: 0, auto: 300, owned: 0, icon: "script/image/station.png" },
    { name: "Machine à carottes automatique", price: 39000, bonusClick: 0, auto: 450, owned: 0, icon: "script/image/machine.png" },
    { name: "Atelier végétal", price: 65000, bonusClick: 0, auto: 700, owned: 0, icon: "script/image/atelier.png" },
    { name: "Chariot volant agricole", price: 97500, bonusClick: 0, auto: 1000, owned: 0, icon: "script/image/chariot_volant.png" },
    { name: "Petit robot fermier", price: 130000, bonusClick: 0, auto: 1400, owned: 0, icon: "script/image/robot_petit.png" },
    { name: "Robot fermier avancé", price: 260000, bonusClick: 0, auto: 2500, owned: 0, icon: "script/image/robot_avance.png" },
    { name: "Complexe agricole", price: 520000, bonusClick: 0, auto: 5000, owned: 0, icon: "script/image/complexe.png" },
    { name: "Tour végétale", price: 975000, bonusClick: 0, auto: 10000, owned: 0, icon: "script/image/tour.png" },
    { name: "Temple sacré du lapin", price: 1300000, bonusClick: 0, auto: 20000, owned: 0, icon: "script/image/temple.png" },
    { name: "Laboratoire agricole", price: 2000000, bonusClick: 0, auto: 35000, owned: 0, icon: "script/image/labo.png" },
    { name: "Centre de recherche lapin", price: 3500000, bonusClick: 0, auto: 60000, owned: 0, icon: "script/image/recherche.png" },
    { name: "Drone agricole", price: 6000000, bonusClick: 0, auto: 100000, owned: 0, icon: "script/image/drone.png" },
    { name: "Méga usine automatisée", price: 18000000, bonusClick: 0, auto: 320000, owned: 0, icon: "script/image/mega_usine.png" },
    { name: "IA agricole", price: 30000000, bonusClick: 0, auto: 550000, owned: 0, icon: "script/image/ia.png" },
    { name: "Réseau agricole mondial", price: 52000000, bonusClick: 0, auto: 900000, owned: 0, icon: "script/image/reseau.png" },
    { name: "Station orbitale agricole", price: 90000000, bonusClick: 0, auto: 1500000, owned: 0, icon: "script/image/orbite.png" },
    { name: "Portail dimensionnel végétal", price: 150000000, bonusClick: 0, auto: 2500000, owned: 0, icon: "script/image/portail.png" },
    { name: "Entité ancestrale des carottes", price: 300000000, bonusClick: 0, auto: 5000000, owned: 0, icon: "script/image/dieu.png" }
  ];

  // Définit basePrice si absent
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
      item.price = Math.ceil(item.price * 1.4 / 5) * 5; // arrondi à 5

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

