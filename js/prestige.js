(() => {
  const prestigeUpgrades = [
    {
      id: 'upgrade1',
      name: 'Bounty de Bronze',
      desc: '+1 multiplicateur de clic',
      cost: 1,
      icon: '',
      effect: () => {
        window.BountyGame.multiplier = (window.BountyGame.multiplier || 1) + 1;
      },
      requirements: []
    },
    {
      id: 'rebirth_boost_1',
      name: 'Expert en Rebirth',
      desc: '+25% de Prestige par rebirth',
      cost: 50,
      icon: '',
      requirements: ['upgrade3']
    },
    {
      id: 'upgrade2',
      name: 'Bounty d\'Argent',
      desc: '+2 multiplicateur de clic',
      cost: 2,
      icon: '',
      effect: () => {
        window.BountyGame.multiplier = (window.BountyGame.multiplier || 1) + 2;
      },
      requirements: ['upgrade1']
    },
    {
      id: 'upgrade3',
      name: 'Bounty d\'Or',
      desc: '+5 multiplicateur de clic (Désactivé après un Rebirth)',
      cost: 3,
      icon: '',
      effect: () => {
        if ((window.BountyGame.rebirths || 0) === 0) {
          window.BountyGame.multiplier = (window.BountyGame.multiplier || 1) + 5;
        }
      },
      requirements: ['upgrade2']
    },
    {
      id: 'upgrade4',
      name: 'Super Croquettes',
      desc: '+10% CPS permanent',
      cost: 5,
      icon: '',
      effect: () => {
        // L'effet est appliqué dans calculCPS via les unlockedUpgrades
      },
      requirements: ['upgrade2']
    },
    {
      id: 'upgrade5',
      name: 'Maître du Click',
      desc: '+10 valeur de clic de base',
      cost: 10,
      icon: '',
      effect: () => {
        window.BountyGame.clickValue = (window.BountyGame.clickValue || 1) + 10;
      },
      requirements: ['upgrade3', 'upgrade4']
    },
    {
      id: 'upgrade6',
      name: 'Bounty de Diamant',
      desc: '+10 multiplicateur de clic',
      cost: 20,
      icon: '',
      requirements: ['upgrade5']
    },
    {
      id: 'upgrade7',
      name: 'Économie Circulaire',
      desc: 'Réduit le prix des bâtiments de 10%',
      cost: 30,
      icon: '',
      requirements: ['upgrade5']
    },
    {
      id: 'upgrade8',
      name: 'Usine Automatisée',
      desc: '+25% CPS global permanent',
      cost: 50,
      icon: '',
      requirements: ['upgrade6', 'upgrade7']
    },
    {
      id: 'upgrade9',
      name: 'Bounty de Platine',
      desc: '+25 multiplicateur de clic',
      cost: 75,
      icon: '',
      requirements: ['upgrade8']
    },
    {
      id: 'upgrade10',
      name: 'Méga Clicker',
      desc: '+50 valeur de clic de base',
      cost: 100,
      icon: '',
      requirements: ['upgrade9']
    },
    {
      id: 'upgrade11',
      name: 'Bounty d\'Émeraude',
      desc: '+50 multiplicateur de clic',
      cost: 150,
      icon: '',
      requirements: ['upgrade10']
    },
    {
      id: 'upgrade12',
      name: 'Empire Solaire',
      desc: 'Double le CPS global permanent',
      cost: 250,
      icon: '',
      requirements: ['upgrade11']
    },
    {
      id: 'upgrade13',
      name: 'Bounty d\'Antimatière',
      desc: '+250 multiplicateur de clic',
      cost: 500,
      icon: '',
      requirements: ['upgrade12']
    },
    {
      id: 'upgrade14',
      name: 'Dieu des Croquettes',
      desc: '+500 valeur de clic de base',
      cost: 1000,
      icon: '',
      requirements: ['upgrade13']
    },
    {
      id: 'upgrade15',
      name: 'Singularité Bounty',
      desc: 'Multiplie le CPS global par 5',
      cost: 2500,
      icon: '',
      requirements: ['upgrade14']
    },
    {
      id: 'upgrade16',
      name: 'Nébuleuse de Croquettes',
      desc: '+1,000 multiplicateur de clic',
      cost: 5000,
      icon: '',
      requirements: ['upgrade15']
    },
    {
      id: 'upgrade17',
      name: 'Supernova Bounty',
      desc: '+2,500 valeur de clic de base',
      cost: 10000,
      icon: '',
      requirements: ['upgrade16']
    },
    {
      id: 'upgrade18',
      name: 'Dimension Croquette',
      desc: 'Multiplie le CPS global par 10',
      cost: 25000,
      icon: '',
      requirements: ['upgrade17']
    },
    {
      id: 'upgrade19',
      name: 'Infini Bounty',
      desc: '+10,000 multiplicateur de clic',
      cost: 50000,
      icon: '',
      requirements: ['upgrade18']
    },
    {
      id: 'upgrade20',
      name: 'Dieu Suprême',
      desc: 'Toutes les stats sont multipliées par 2',
      cost: 100000,
      icon: '',
      requirements: ['upgrade19']
    }
  ];

  const treeDiv = document.getElementById('prestigeTree');

  function renderUpgrade(upgrade) {
    const unlockedUpgrades = window.BountyGame.unlockedUpgrades || [];
    const isUnlocked = unlockedUpgrades.includes(upgrade.id);
    const hasRequirements = upgrade.requirements.every(reqId => unlockedUpgrades.includes(reqId));
    const canAfford = (window.BountyGame.prestigePoints >= upgrade.cost);
    const canUnlock = !isUnlocked && hasRequirements && canAfford;

    const root = document.createElement('div');
    root.className = `item prestige-item ${isUnlocked ? 'owned' : ''} ${!isUnlocked && !hasRequirements ? 'locked' : ''}`;
    
    const left = document.createElement('div');
    left.className = 'item-info';
    left.innerHTML = `
      ${upgrade.icon ? `<div class="prestige-icon" style="font-size:24px; margin-right:15px;">${upgrade.icon}</div>` : ''}
      <div style="flex:1">
        <h3>${upgrade.name}</h3>
        <p>${upgrade.desc}</p>
        <div class="item-price" style="font-size:0.85rem; color:#ffd700; font-weight:bold; margin-top:5px;">
          ${isUnlocked ? 'Débloqué' : `Prix: ${upgrade.cost.toLocaleString()} Prestige`}
        </div>
      </div>
    `;
    
    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.className = `btn ${isUnlocked ? 'reset' : 'buy'}`;
    btn.style.minWidth = "100px";
    btn.textContent = isUnlocked ? 'Possédé' : 'Acheter';
    btn.disabled = isUnlocked || !canUnlock;
    
    btn.addEventListener('click', () => {
      unlockUpgrade(upgrade);
    });

    right.appendChild(btn);
    root.appendChild(left);
    root.appendChild(right);
    
    return root;
  }

  function unlockUpgrade(upgrade) {
    if (window.BountyGame.prestigePoints >= upgrade.cost) {
      window.BountyGame.prestigePoints = Math.max(0, window.BountyGame.prestigePoints - upgrade.cost);
      if (!window.BountyGame.unlockedUpgrades) window.BountyGame.unlockedUpgrades = [];
      window.BountyGame.unlockedUpgrades.push(upgrade.id);
      
      // Re-calculer les bonus
      if (window.recalculerMultiplier) window.recalculerMultiplier();
      if (window.applyPrestigeUpgrades) window.applyPrestigeUpgrades();
      
      if (window.updatePrestigeUI) window.updatePrestigeUI();
      if (window.updateCounterUI) window.updateCounterUI();
      if (window.sauvegarderJeu) window.sauvegarderJeu();
      updatePrestigeTree();
    }
  }

  function updatePrestigeTree() {
    if (!treeDiv) return;
    treeDiv.innerHTML = '';
    prestigeUpgrades.forEach(upgrade => {
      treeDiv.appendChild(renderUpgrade(upgrade));
    });
  }

  // Exposer pour les autres scripts
  window.updatePrestigeTree = updatePrestigeTree;
  window.prestigeUpgrades = prestigeUpgrades;

  document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que BountyGame est initialisé
    window.BountyGame = window.BountyGame || {};
    
    setTimeout(updatePrestigeTree, 100);
  });
})();
