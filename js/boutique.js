(() => {
  // Définition des items du shop
  const fallbackIcon = "assets/images/bounty.jpg";
  window.storeItemsData = [
    { name: "Gamelle à carottes", price: 15, bonusClick: 1, auto: 0, owned: 0, icon: fallbackIcon },
    { name: "Clapier amélioré", price: 65, bonusClick: 5, auto: 0, owned: 0, icon: fallbackIcon },
    { name: "Botte de carottes", price: 130, bonusClick: 0, auto: 1, owned: 0, icon: fallbackIcon },
    { name: "Petit sac de carottes", price: 260, bonusClick: 0, auto: 2, owned: 0, icon: fallbackIcon },
    { name: "Arbre à carottes", price: 455, bonusClick: 0, auto: 3, owned: 0, icon: fallbackIcon },
    { name: "Potager du lapin", price: 650, bonusClick: 0, auto: 5, owned: 0, icon: fallbackIcon },
    { name: "Moyen sac de carottes", price: 1040, bonusClick: 0, auto: 8, owned: 0, icon: fallbackIcon },
    { name: "Grand sac de carottes", price: 1560, bonusClick: 0, auto: 12, owned: 0, icon: fallbackIcon },
    { name: "Chariot à carottes", price: 2600, bonusClick: 0, auto: 20, owned: 0, icon: fallbackIcon },
    { name: "Ferme de carottes", price: 4550, bonusClick: 0, auto: 30, owned: 0, icon: fallbackIcon },
    { name: "Lapin cultivateur", price: 6500, bonusClick: 0, auto: 80, owned: 0, icon: fallbackIcon },
    { name: "Mini usine végétale", price: 10400, bonusClick: 0, auto: 120, owned: 0, icon: fallbackIcon },
    { name: "Usine de carottes", price: 15600, bonusClick: 0, auto: 180, owned: 0, icon: fallbackIcon },
    { name: "Station agricole lapine", price: 26000, bonusClick: 0, auto: 300, owned: 0, icon: fallbackIcon },
    { name: "Machine à carottes automatique", price: 39000, bonusClick: 0, auto: 450, owned: 0, icon: fallbackIcon },
    { name: "Atelier végétal", price: 65000, bonusClick: 0, auto: 700, owned: 0, icon: fallbackIcon },
    { name: "Chariot volant agricole", price: 97500, bonusClick: 0, auto: 1000, owned: 0, icon: fallbackIcon },
    { name: "Petit robot fermier", price: 130000, bonusClick: 0, auto: 1400, owned: 0, icon: fallbackIcon },
    { name: "Robot fermier avancé", price: 260000, bonusClick: 0, auto: 2500, owned: 0, icon: fallbackIcon },
    { name: "Complexe agricole", price: 520000, bonusClick: 0, auto: 5000, owned: 0, icon: fallbackIcon },
    { name: "Tour végétale", price: 975000, bonusClick: 0, auto: 10000, owned: 0, icon: fallbackIcon },
    { name: "Temple sacré du lapin", price: 1300000, bonusClick: 0, auto: 20000, owned: 0, icon: fallbackIcon },
    { name: "Laboratoire agricole", price: 2000000, bonusClick: 0, auto: 35000, owned: 0, icon: fallbackIcon },
    { name: "Centre de recherche lapin", price: 3500000, bonusClick: 0, auto: 60000, owned: 0, icon: fallbackIcon },
    { name: "Drone agricole", price: 6000000, bonusClick: 0, auto: 100000, owned: 0, icon: fallbackIcon },
    { name: "Méga usine automatisée", price: 18000000, bonusClick: 0, auto: 320000, owned: 0, icon: fallbackIcon },
    { name: "IA agricole", price: 30000000, bonusClick: 0, auto: 550000, owned: 0, icon: fallbackIcon },
    { name: "Réseau agricole mondial", price: 52000000, bonusClick: 0, auto: 900000, owned: 0, icon: fallbackIcon },
    { name: "Station orbitale agricole", price: 90000000, bonusClick: 0, auto: 1500000, owned: 0, icon: fallbackIcon },
    { name: "Portail dimensionnel végétal", price: 150000000, bonusClick: 0, auto: 2500000, owned: 0, icon: fallbackIcon },
    { name: "Entité ancestrale des carottes", price: 300000000, bonusClick: 0, auto: 5000000, owned: 0, icon: fallbackIcon }
  ];

  // Définit basePrice si absent
  window.storeItemsData.forEach(it => { if (it.basePrice === undefined) it.basePrice = it.price; });

  window.buyAmount = 1;

  // Encapsuler tout après DOMContentLoaded pour PC et Mobile
  document.addEventListener('DOMContentLoaded', () => {
    const storeDiv = document.getElementById('storeItems') || document.getElementById('shopList');
    if (!storeDiv) return;

    // Ajouter les contrôles de quantité
    const controls = document.createElement('div');
    controls.className = 'buy-controls';
    controls.style.cssText = 'display:flex; justify-content:center; gap:10px; margin-bottom:15px;';
    [1, 10, 100].forEach(amt => {
      const b = document.createElement('button');
      b.className = 'btn-small' + (amt === 1 ? ' active' : '');
      b.textContent = 'x' + amt;
      b.onclick = () => {
        window.buyAmount = amt;
        Array.from(controls.children).forEach(c => c.classList.remove('active'));
        b.classList.add('active');
        updateStore();
      };
      controls.appendChild(b);
    });
    storeDiv.parentNode.insertBefore(controls, storeDiv);

    function getBulkPrice(item, amount, idx) {
      let total = 0;
      let tempPrice = item.price;
      const boosts = window.boostsData || [];
      const unlocked = window.BountyGame?.unlockedUpgrades || [];
      
      for(let i=0; i<amount; i++) {
        let p = tempPrice;
        if (idx < 4 && boosts[3]?.active) p = Math.floor(p * 0.8);
        if (window.BountyGame?.nextBuildingDiscount) p = Math.floor(p * 0.75);
        if (unlocked.includes('upgrade7')) p = Math.floor(p * 0.9);
        total += p;
        tempPrice = Math.ceil(tempPrice * 1.4 / 5) * 5;
      }
      return total;
    }

    function renderItem(item, idx) {
      const root = document.createElement('div');
      root.className = 'item';
      root.setAttribute('data-idx', idx);

      const displayPrice = getBulkPrice(item, window.buyAmount, idx);

      const left = document.createElement('div'); left.className = 'left';
      const img = document.createElement('img'); img.className = 'icon'; img.src = item.icon;
      img.loading = "lazy"; // Optimisation chargement
      const txt = document.createElement('div');
      txt.innerHTML = `<strong>${item.name}</strong><div class="item-price" style="font-size:12px;color:rgba(255,255,255,0.7)">Prix: ${displayPrice}</div>`;
      left.appendChild(img); left.appendChild(txt);

      const right = document.createElement('div');
      const btn = document.createElement('button'); btn.className = 'btn buy'; btn.textContent = 'Acheter';
      btn.disabled = !(window.BountyGame && window.BountyGame.count >= displayPrice);
      btn.addEventListener('click', (e) => { e.stopPropagation(); acheterItem(idx); });

      const tooltip = document.createElement('span'); tooltip.className = 'tooltip';
      if (item.bonusClick) tooltip.textContent = `+${item.bonusClick * window.buyAmount} par clic !`;
      else if (item.auto) tooltip.textContent = `+${item.auto * window.buyAmount} auto-croquettes !`;
      btn.appendChild(tooltip);

      right.appendChild(btn);
      const badge = document.createElement('div'); badge.className = 'count-badge'; badge.textContent = item.owned;

      root.appendChild(left); root.appendChild(right); root.appendChild(badge);
      return root;
    }

    function updateStore() {
      const items = window.storeItemsData;
      if (storeDiv.children.length === 0) {
        items.forEach((item, idx) => {
          storeDiv.appendChild(renderItem(item, idx));
        });
        return;
      }

      items.forEach((item, idx) => {
        const node = storeDiv.children[idx];
        if (!node) return;
        
        const displayPrice = getBulkPrice(item, window.buyAmount, idx);

        const btn = node.querySelector('.buy');
        if (btn) btn.disabled = !(window.BountyGame && window.BountyGame.count >= displayPrice);
        const priceDiv = node.querySelector('.item-price');
        if (priceDiv) priceDiv.textContent = `Prix: ${displayPrice}`;
        const badge = node.querySelector('.count-badge');
        if (badge) badge.textContent = item.owned;
        
        const tooltip = node.querySelector('.tooltip');
        if (tooltip) {
          if (item.bonusClick) tooltip.textContent = `+${item.bonusClick * window.buyAmount} par clic !`;
          else if (item.auto) tooltip.textContent = `+${item.auto * window.buyAmount} auto-croquettes !`;
        }
      });
    }

    function acheterItem(idx) {
      const item = window.storeItemsData[idx];
      if (!item) return;

      const node = storeDiv.children[idx];
      const btn = node?.querySelector('.buy');
      if (btn) {
        if (btn.classList.contains('processing')) return;
        btn.classList.add('processing');
        setTimeout(() => btn.classList.remove('processing'), 200);
      }

      const amount = window.buyAmount;
      const effectivePrice = getBulkPrice(item, amount, idx);

      if ((window.BountyGame?.count ?? 0) >= effectivePrice) {
        window.BountyGame.count -= effectivePrice;
        
        for(let i=0; i<amount; i++) {
          if (item.bonusClick) {
            window.BountyGame.shopMultiplierBonus = (window.BountyGame.shopMultiplierBonus || 0) + item.bonusClick;
            window.BountyGame.multiplier = (window.BountyGame.multiplier || 1) + item.bonusClick;
          }
          item.owned += 1;
          item.price = Math.ceil(item.price * 1.4 / 5) * 5;
        }

        // Animation flash
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

    // Affichage initial du shop
    setTimeout(() => updateStore(), 40);
  });
})();
