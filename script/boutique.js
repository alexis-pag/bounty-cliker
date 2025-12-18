(() => {
  window.storeItemsData = [
   
const items = [
    { name: "Gamelle à carottes", price: 15, bonusClick: 1, auto: 0, owned: 0 },
    { name: "Clapier amélioré", price: 65, bonusClick: 5, auto: 0, owned: 0 },
    { name: "Botte de carottes", price: 130, bonusClick: 0, auto: 1, owned: 0 },
    { name: "Petit sac de carottes", price: 260, bonusClick: 0, auto: 2, owned: 0 },
    { name: "Arbre à carottes", price: 455, bonusClick: 0, auto: 3, owned: 0 },
    { name: "Potager du lapin", price: 650, bonusClick: 0, auto: 5, owned: 0 },
    { name: "Moyen sac de carottes", price: 1040, bonusClick: 0, auto: 8, owned: 0 },
    { name: "Grand sac de carottes", price: 1560, bonusClick: 0, auto: 12, owned: 0 },
    { name: "Chariot à carottes", price: 2600, bonusClick: 0, auto: 20, owned: 0 },
    { name: "Ferme de carottes", price: 4550, bonusClick: 0, auto: 30, owned: 0 },
    { name: "Lapin cultivateur", price: 6500, bonusClick: 0, auto: 80, owned: 0 },
    { name: "Mini usine végétale", price: 10400, bonusClick: 0, auto: 120, owned: 0 },
    { name: "Usine de carottes", price: 15600, bonusClick: 0, auto: 180, owned: 0 },
    { name: "Station agricole lapine", price: 26000, bonusClick: 0, auto: 300, owned: 0 },
    { name: "Machine à carottes automatique", price: 39000, bonusClick: 0, auto: 450, owned: 0 },
    { name: "Atelier végétal", price: 65000, bonusClick: 0, auto: 700, owned: 0 },
    { name: "Chariot volant agricole", price: 97500, bonusClick: 0, auto: 1000, owned: 0 },
    { name: "Petit robot fermier", price: 130000, bonusClick: 0, auto: 1400, owned: 0 },
    { name: "Robot fermier avancé", price: 260000, bonusClick: 0, auto: 2500, owned: 0 },
    { name: "Complexe agricole", price: 520000, bonusClick: 0, auto: 5000, owned: 0 },
    { name: "Tour végétale", price: 975000, bonusClick: 0, auto: 10000, owned: 0 },
    { name: "Temple sacré du lapin", price: 1300000, bonusClick: 0, auto: 20000, owned: 0 },
    { name: "Laboratoire agricole", price: 2000000, bonusClick: 0, auto: 35000, owned: 0 },
    { name: "Centre de recherche lapin", price: 3500000, bonusClick: 0, auto: 60000, owned: 0 },
    { name: "Drone agricole", price: 6000000, bonusClick: 0, auto: 100000, owned: 0 },
    { name: "Méga usine automatisée", price: 18000000, bonusClick: 0, auto: 320000, owned: 0 },
    { name: "IA agricole", price: 30000000, bonusClick: 0, auto: 550000, owned: 0 },
    { name: "Réseau agricole mondial", price: 52000000, bonusClick: 0, auto: 900000, owned: 0 },
    { name: "Station orbitale agricole", price: 90000000, bonusClick: 0, auto: 1500000, owned: 0 },
    { name: "Portail dimensionnel végétal", price: 150000000, bonusClick: 0, auto: 2500000, owned: 0 },
    { name: "Entité ancestrale des carottes", price: 300000000, bonusClick: 0, auto: 5000000, owned: 0 },
    { name: "Champ de trèfles", price: 500000000, bonusClick: 0, auto: 8000000, owned: 0 },
    { name: "Serre lunaire", price: 800000000, bonusClick: 0, auto: 12000000, owned: 0 },
    { name: "Carottes dorées", price: 1300000000, bonusClick: 0, auto: 20000000, owned: 0 },
    { name: "Racines éternelles", price: 2000000000, bonusClick: 0, auto: 35000000, owned: 0 },
    { name: "Graines antiques", price: 3500000000, bonusClick: 0, auto: 60000000, owned: 0 },
    { name: "Engrais sacré", price: 6000000000, bonusClick: 0, auto: 100000000, owned: 0 },
    { name: "Compost alchimique", price: 10000000000, bonusClick: 0, auto: 180000000, owned: 0 },
    { name: "Ville souterraine de lapins", price: 18000000000, bonusClick: 0, auto: 320000000, owned: 0 },
    { name: "Continent potager", price: 30000000000, bonusClick: 0, auto: 550000000, owned: 0 },
    { name: "Planète de carottes", price: 52000000000, bonusClick: 0, auto: 900000000, owned: 0 },
    { name: "Station spatiale lapine", price: 90000000000, bonusClick: 0, auto: 1500000000, owned: 0 },
    { name: "Trou noir à carottes", price: 150000000000, bonusClick: 0, auto: 2500000000, owned: 0 },
    { name: "Univers végétal", price: 300000000000, bonusClick: 0, auto: 5000000000, owned: 0 },
    { name: "Multivers lapin", price: 520000000000, bonusClick: 0, auto: 9000000000, owned: 0 },
    { name: "Dieu du trèfle", price: 900000000000, bonusClick: 0, auto: 15000000000, owned: 0 },
    { name: "Cycle éternel des lapins", price: 1500000000000, bonusClick: 0, auto: 25000000000, owned: 0 },
    { name: "Simulation divine", price: 3000000000000, bonusClick: 0, auto: 50000000000, owned: 0 },
    { name: "Lapin créateur de réalités", price: 5200000000000, bonusClick: 0, auto: 90000000000, owned: 0 },
    { name: "Éther végétal", price: 9000000000000, bonusClick: 0, auto: 150000000000, owned: 0 },
    { name: "Lapin primordial", price: 15000000000000, bonusClick: 0, auto: 250000000000, owned: 0 },
    { name: "Dieu suprême des carottes", price: 30000000000000, bonusClick: 0, auto: 500000000000, owned: 0 }
];

  ];


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
