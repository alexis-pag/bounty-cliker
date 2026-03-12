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
    { name: "Entité ancestrale des carottes", price: 300000000, bonusClick: 0, auto: 5000000, owned: 0, icon: fallbackIcon },
    { name: "Galaxie de carottes", price: 750000000, bonusClick: 0, auto: 12000000, owned: 0, icon: fallbackIcon },
    { name: "Amas stellaire de carottes", price: 1500000000, bonusClick: 0, auto: 25000000, owned: 0, icon: fallbackIcon },
    { name: "Superamas de carottes", price: 4000000000, bonusClick: 0, auto: 60000000, owned: 0, icon: fallbackIcon },
    { name: "Univers de carottes", price: 10000000000, bonusClick: 0, auto: 150000000, owned: 0, icon: fallbackIcon },
    { name: "Multivers de carottes", price: 25000000000, bonusClick: 0, auto: 400000000, owned: 0, icon: fallbackIcon },
    { name: "Omnivers de carottes", price: 75000000000, bonusClick: 0, auto: 1000000000, owned: 0, icon: fallbackIcon },
    { name: "Bounty Suprême", price: 150000000000, bonusClick: 5000, auto: 0, owned: 0, icon: fallbackIcon }
  ];

  // Définit basePrice si absent
  window.storeItemsData.forEach(it => { if (it.basePrice === undefined) it.basePrice = it.price; });

  window.buyAmount = 1;

  window.setBuyAmount = (amt) => {
    window.buyAmount = amt;
    const btns = document.querySelectorAll('.btn-qty');
    btns.forEach(b => {
      b.classList.toggle('active', parseInt(b.textContent.replace('x', '')) === amt);
    });
    if (window.updateStore) window.updateStore();
  };

  // Encapsuler tout après DOMContentLoaded pour PC et Mobile
  document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que BountyGame est initialisé
    window.BountyGame = window.BountyGame || {};
    
    const storeDivs = [
      document.getElementById('storeItems'),
      document.getElementById('shopList'),
      document.getElementById('shopListMain')
    ].filter(el => el !== null);

    if (storeDivs.length === 0) return;

    function getBulkPrice(item, amount, idx) {
      let total = 0;
      let tempPrice = item.price;
      const boosts = window.boostsData || [];
      const unlocked = window.BountyGame?.unlockedUpgrades || [];
      const currencyUpgrades = window.BountyGame?.unlockedCurrencyUpgrades || [];
      
      for(let i=0; i<amount; i++) {
        let p = tempPrice;
        if (idx < 4 && boosts[3]?.active) p = Math.floor(p * 0.8);
        if (window.BountyGame?.nextBuildingDiscount) p = Math.floor(p * 0.75);
        if (unlocked.includes('upgrade7')) p = Math.floor(p * 0.9);
        // Token Upgrade 3: -15% price
        if (currencyUpgrades.includes('token_3')) p = Math.floor(p * 0.85);
        
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
      const perUnit = item.bonusClick ? item.bonusClick : item.auto;
      const type = item.bonusClick ? '/clic' : '/sec';
      const bonusText = item.bonusClick ? `+${(item.bonusClick * window.buyAmount).toLocaleString()} ${type}` : `+${(item.auto * window.buyAmount).toLocaleString()} ${type}`;

      root.innerHTML = `
        <div class="count-badge">${item.owned}</div>
        <div class="item-info">
          <div class="icon-wrapper">
            <img src="${item.icon}" class="icon" loading="lazy">
          </div>
          <h3>${item.name}</h3>
          <div class="item-stats">
            <span class="item-bonus">✨ Total: ${bonusText}</span>
            <span class="item-unit" style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">Base: +${perUnit.toLocaleString()} ${type}</span>
            <span class="item-price">💰 ${displayPrice.toLocaleString()}</span>
          </div>
        </div>
        <button class="btn buy">ACHETER</button>
      `;

      const btn = root.querySelector('.buy');
      btn.disabled = !(window.BountyGame && window.BountyGame.count >= displayPrice);
      btn.addEventListener('click', (e) => { e.stopPropagation(); acheterItem(idx); });

      return root;
    }

    function updateStore() {
      const items = window.storeItemsData;
      
      storeDivs.forEach(storeDiv => {
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
          const perUnit = item.bonusClick ? item.bonusClick : item.auto;
          const type = item.bonusClick ? '/clic' : '/sec';
          const bonusText = item.bonusClick ? `+${(item.bonusClick * window.buyAmount).toLocaleString()} ${type}` : `+${(item.auto * window.buyAmount).toLocaleString()} ${type}`;

          const btn = node.querySelector('.buy');
          if (btn) btn.disabled = !(window.BountyGame && window.BountyGame.count >= displayPrice);
          
          const priceSpan = node.querySelector('.item-price');
          if (priceSpan) priceSpan.textContent = `💰 ${displayPrice.toLocaleString()}`;
          
          const bonusSpan = node.querySelector('.item-bonus');
          if (bonusSpan) bonusSpan.textContent = `✨ Total: ${bonusText}`;

          const unitSpan = node.querySelector('.item-unit');
          if (unitSpan) unitSpan.textContent = `Base: +${perUnit.toLocaleString()} ${type}`;

          const badge = node.querySelector('.count-badge');
          if (badge) badge.textContent = item.owned;
        });
      });
    }

    function acheterItem(idx) {
      const item = window.storeItemsData[idx];
      if (!item) return;

      // Check processing state on ANY of the buttons
      let isProcessing = false;
      storeDivs.forEach(storeDiv => {
        const btn = storeDiv.children[idx]?.querySelector('.buy');
        if (btn?.classList.contains('processing')) isProcessing = true;
      });
      if (isProcessing) return;

      const amount = window.buyAmount;
      const effectivePrice = getBulkPrice(item, amount, idx);

      if ((window.BountyGame?.count ?? 0) >= effectivePrice) {
        window.BountyGame.count = Math.max(0, window.BountyGame.count - effectivePrice);
        
        for(let i=0; i<amount; i++) {
          if (item.bonusClick) {
            window.BountyGame.shopMultiplierBonus = (Number(window.BountyGame.shopMultiplierBonus) || 0) + item.bonusClick;
          }
          item.owned += 1;
          item.price = Math.ceil(item.price * 1.4 / 5) * 5;
        }

        // Animation flash & feedback on all containers
        storeDivs.forEach(storeDiv => {
          const node = storeDiv.children[idx];
          if (!node) return;

          const btn = node.querySelector('.buy');
          if (btn) {
            btn.classList.add('processing');
            setTimeout(() => btn.classList.remove('processing'), 200);
          }

          const flash = document.createElement('div'); flash.className = 'boost-appear';
          flash.style.position = 'absolute'; flash.style.inset = '0';
          node.appendChild(flash); setTimeout(() => flash.remove(), 420);

          const impactText = item.bonusClick ? `+${(item.bonusClick * amount).toLocaleString()} /clic !` : `+${(item.auto * amount).toLocaleString()} /sec !`;
          const impact = document.createElement('div');
          impact.className = 'purchase-impact';
          impact.textContent = impactText;
          impact.style.cssText = `
              position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
              color: #00ff88; font-weight: 900; font-size: 1.2rem; pointer-events: none;
              text-shadow: 0 0 10px rgba(0,255,136,0.6); animation: floatUp 1s ease-out forwards;
          `;
          node.appendChild(impact);
          setTimeout(() => impact.remove(), 1000);
        });

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
