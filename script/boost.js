(() => {
  window.boostsData = [
    { name: "Bounty doré", desc: "x1.5 sur les clicks", price: 500, active: false, available: false, permanent: false },
    { name: "Employés compétents", desc: "Double le CPS des bâtiments", price: 800, active: false, available: false, permanent: false },
    { name: "Marchand louche", desc: "Double ou perte 50/50", price: 1200, active: false, available: false, permanent: false },
    { name: "Alexis de compagnie", desc: "Réduit le prix des 4 premiers bâtiments de 20%", price: 1500, active: false, available: false, permanent: false },
    { name: "Augmentation des droits à Bounty", desc: "Boost la rentabilité de 5%", price: 2000, active: false, available: false, permanent: false },
    { name: "Bonus mystère 1", desc: "+10% clic", price: 1000, active: false, available: false, permanent: false },
    { name: "Bonus mystère 2", desc: "+20% CPS", price: 2000, active: false, available: false, permanent: false },
    { name: "Bonus mystère 3", desc: "+50 croquettes aléatoires", price: 500, active: false, available: false, permanent: false },
    { name: "Bonus mystère 4", desc: "Double le multiplicateur temporairement", price: 3500, active: false, available: false, permanent: false },
    { name: "Bonus mystère 5", desc: "Réduit le prix du prochain bâtiment", price: 2500, active: false, available: false, permanent: false }
  ];

  const boostsDiv = document.getElementById('boostsContainer');

  function makeBoostNode(b, idx) {
    const root = document.createElement('div');
    root.className = 'boost-node';
    if (b.active || b.permanent) root.classList.add('boost-active');
    if (b.available && !b.active) root.classList.add('boost-appear');

    const left = document.createElement('div');
    left.innerHTML = `<strong>${b.name}</strong><div style="font-size:12px;color:rgba(255,255,255,0.75)">Prix: ${b.price}</div>`;

    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = 'btn activate';
    btn.textContent = b.active ? 'Actif' : 'Acheter';

    // CORRECTION : bouton activable si le joueur a assez de croquettes
    btn.disabled = !(window.BountyGame && window.BountyGame.count >= b.price);

    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      purchaseBoost(idx);
    });

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = b.desc;

    root.appendChild(left);
    right.appendChild(btn);
    root.appendChild(right);
    root.appendChild(tooltip);

    return root;
  }

  function afficherBoosts() {
    boostsDiv.innerHTML = '';
    window.boostsData.forEach((b, i) => {
      boostsDiv.appendChild(makeBoostNode(b, i));
    });
  }

  function purchaseBoost(idx) {
    const b = window.boostsData[idx];
    if (!b) return;
    if (window.BountyGame.count >= b.price) {
      window.BountyGame.count -= b.price;
      b.active = true;
      b.permanent = true;
      b.available = false;

      if (b.name.includes('Bonus mystère 3')) window.BountyGame.count += 50;

      if (window.updateCounterUI) window.updateCounterUI();
      if (window.sauvegarderJeu) window.sauvegarderJeu();
      if (window.updateStore) window.updateStore();
      afficherBoosts();
    } else {
      const old = document.body.style.filter;
      document.body.style.filter = 'brightness(.85)';
      setTimeout(() => document.body.style.filter = old, 220);
    }
  }

  function scheduleSpawn() {
    window.boostsData.forEach(b => { if (!b.permanent) b.available = false; });

    const pool = window.boostsData.filter(b => !b.permanent);
    if (pool.length === 0) return;

    let n = 1;
    const r = Math.random();
    if (r < 0.18) n = 2;
    if (r < 0.05) n = 3;

    for (let i = 0; i < n; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(Math.random() * pool.length);
      const chosen = pool.splice(idx, 1)[0];
      chosen.available = true;
      chosen.rare = Math.random() < 0.08;

      const timeVisible = 15000 + Math.random() * 30000;
      setTimeout(() => {
        if (!chosen.permanent && chosen.available) {
          chosen.available = false;
          if (window.afficherBoosts) window.afficherBoosts();
        }
      }, timeVisible);
    }

    if (window.afficherBoosts) window.afficherBoosts();

    const nextIn = 20000 + Math.random() * 70000;
    setTimeout(scheduleSpawn, nextIn);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      afficherBoosts();
      setTimeout(scheduleSpawn, 1200 + Math.random() * 2600);
    }, 40);
  });

  window.afficherBoosts = afficherBoosts;
})();
