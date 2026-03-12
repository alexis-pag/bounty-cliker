(() => {
    // Definir les types de monnaies
    window.Currencies = {
        COINS: { id: 'count', name: 'Croquettes', icon: '' },
        GEMS: { id: 'rabbitGems', name: 'Gemmes de Lapin', icon: '' },
        TOKENS: { id: 'rabbitTokens', name: 'Jetons de Carotte', icon: '' },
        PRESTIGE: { id: 'prestigePoints', name: 'Points de Prestige', icon: '' }
    };

    // Arbre d'améliorations pour les Gemmes
    const gemUpgrades = [
        {
            id: 'gem_1',
            name: 'Éclat de Diamant',
            desc: '+2 multiplicateur de clic (Permanent)',
            cost: { rabbitGems: 10 },
            icon: '',
            requirements: []
        },
        {
            id: 'gem_2',
            name: 'Prisme de Chance',
            desc: '+5 multiplicateur de clic',
            cost: { rabbitGems: 25 },
            icon: '',
            requirements: ['gem_1']
        },
        {
            id: 'gem_3',
            name: 'Résonance Cristalline',
            desc: '+20% CPS Global',
            cost: { rabbitGems: 50 },
            icon: '',
            requirements: ['gem_2']
        },
        {
            id: 'gem_4',
            name: 'Générateur de Faille',
            desc: 'Donne 1 Jeton de Carotte toutes les 5 minutes',
            cost: { rabbitGems: 100 },
            icon: '',
            requirements: ['gem_3']
        }
    ];

    // Arbre d'améliorations pour les Jetons
    const tokenUpgrades = [
        {
            id: 'token_1',
            name: 'Ticket VIP',
            desc: '+5 multiplicateur de clic (Permanent)',
            cost: { rabbitTokens: 5 },
            icon: '',
            requirements: []
        },
        {
            id: 'token_2',
            name: 'Pass Prioritaire',
            desc: '+10 multiplicateur de clic',
            cost: { rabbitTokens: 15 },
            icon: '',
            requirements: ['token_1']
        },
        {
            id: 'token_3',
            name: 'Investissement Sûr',
            desc: 'Réduit les prix du shop de 15%',
            cost: { rabbitTokens: 30 },
            icon: '',
            requirements: ['token_2']
        },
        {
            id: 'token_4',
            name: 'Multiplicateur Dimensionnel',
            desc: 'Multiplie tous les gains de monnaies par 1.25',
            cost: { rabbitTokens: 100 },
            icon: '',
            requirements: ['token_3']
        }
    ];

    // Système d'échange
    const exchanges = [
        {
            id: 'ex_coins_to_gems',
            name: 'Achat de Gemmes',
            desc: '10M Croquettes -> 1 Gemme',
            from: { id: 'count', amount: 10000000 },
            to: { id: 'rabbitGems', amount: 1 }
        },
        {
            id: 'ex_gems_to_tokens',
            name: 'Échange de Luxe',
            desc: '50 Gemmes -> 5 Jetons',
            from: { id: 'rabbitGems', amount: 50 },
            to: { id: 'rabbitTokens', amount: 5 }
        }
    ];

    function canAfford(cost) {
        for (const [currency, amount] of Object.entries(cost)) {
            if ((window.BountyGame[currency] || 0) < amount) return false;
        }
        return true;
    }

    function spendCost(cost) {
        if (!canAfford(cost)) return false;
        for (const [currency, amount] of Object.entries(cost)) {
            window.BountyGame[currency] -= amount;
        }
        return true;
    }

    function buyCurrencyUpgrade(upgrade) {
        if (!window.BountyGame.unlockedCurrencyUpgrades) window.BountyGame.unlockedCurrencyUpgrades = [];
        if (window.BountyGame.unlockedCurrencyUpgrades.includes(upgrade.id)) return;
        
        if (spendCost(upgrade.cost)) {
            window.BountyGame.unlockedCurrencyUpgrades.push(upgrade.id);

            if (window.updateCounterUI) window.updateCounterUI();
            if (window.updateCurrencyTrees) window.updateCurrencyTrees();
            if (window.sauvegarderJeu) window.sauvegarderJeu();
            
            // Appliquer les effets immédiats si nécessaire
            if (window.recalculerMultiplier) window.recalculerMultiplier();
        }
    }

    function executeExchange(exchange) {
        const fromCurrency = exchange.from.id;
        const fromAmount = exchange.from.amount;
        const toCurrency = exchange.to.id;
        const toAmount = exchange.to.amount;

        if ((window.BountyGame[fromCurrency] || 0) >= fromAmount) {
            window.BountyGame[fromCurrency] -= fromAmount;
            window.BountyGame[toCurrency] = (window.BountyGame[toCurrency] || 0) + toAmount;
            
            if (window.updateCounterUI) window.updateCounterUI();
            if (window.sauvegarderJeu) window.sauvegarderJeu();
            alert(`Échange réussi : ${exchange.name}`);
        } else {
            alert(`Pas assez de ${window.Currencies[fromCurrency.toUpperCase()]?.name || fromCurrency}`);
        }
    }

    // Rendu des arbres
    function renderTree(containerId, upgrades, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!window.BountyGame.unlockedCurrencyUpgrades) window.BountyGame.unlockedCurrencyUpgrades = [];

        container.innerHTML = `<h3>${title}</h3>`;
        const list = document.createElement('div');
        list.className = 'list';

        upgrades.forEach(upg => {
            const isUnlocked = window.BountyGame.unlockedCurrencyUpgrades.includes(upg.id);
            const hasReqs = upg.requirements.every(req => window.BountyGame.unlockedCurrencyUpgrades.includes(req));
            const affordable = canAfford(upg.cost);

            const item = document.createElement('div');
            item.className = `item ${isUnlocked ? 'owned' : ''} ${!isUnlocked && !hasReqs ? 'locked' : ''}`;
            
            const costText = Object.entries(upg.cost).map(([curr, amt]) => `${amt.toLocaleString()} ${window.Currencies[curr.toUpperCase()]?.icon || ''}`).join(', ');

            item.innerHTML = `
                <div class="item-info">
                    <div style="flex: 1;">
                        <h3>${upg.name}</h3>
                        <p>${upg.desc}</p>
                        <div style="font-size: 0.85rem; color: ${isUnlocked ? 'var(--neon-green)' : '#ffd700'}; font-weight: bold; margin-top:5px;">
                            ${isUnlocked ? '✓ ACQUIS' : 'Coût: ' + costText}
                        </div>
                    </div>
                </div>
                <button class="btn ${isUnlocked ? 'reset' : 'buy'}" ${isUnlocked || !hasReqs || !affordable ? 'disabled' : ''} style="min-width: 100px;">
                    ${isUnlocked ? 'Possédé' : (hasReqs ? 'Acheter' : 'Bloqué')}
                </button>
            `;

            if (!isUnlocked && hasReqs && affordable) {
                item.querySelector('button').onclick = () => buyCurrencyUpgrade(upg);
            }

            list.appendChild(item);
        });
        container.appendChild(list);
    }

    function renderExchanges() {
        const container = document.getElementById('exchangeContainer');
        if (!container) return;

        container.innerHTML = `<h3>Bureau de Change</h3>`;
        const list = document.createElement('div');
        list.className = 'list';

        exchanges.forEach(ex => {
            const affordable = (window.BountyGame[ex.from.id] || 0) >= ex.from.amount;
            const item = document.createElement('div');
            item.className = 'item exchange-item';
            item.innerHTML = `
                <div class="item-info">
                    <h3>${ex.name}</h3>
                    <p>${ex.desc}</p>
                </div>
                <button class="btn activate" ${!affordable ? 'disabled' : ''} style="padding: 12px 25px;">Échanger</button>
            `;
            item.querySelector('button').onclick = () => executeExchange(ex);
            list.appendChild(item);
        });
        container.appendChild(list);
    }

    window.updateCurrencyTrees = () => {
        renderTree('gemTreeContainer', gemUpgrades, 'Améliorations de Gemmes');
        renderTree('tokenTreeContainer', tokenUpgrades, 'Améliorations de Jetons');
        renderExchanges();
    };

    // Passive generation from Gem upgrade 4
    setInterval(() => {
        if (window.BountyGame.unlockedCurrencyUpgrades.includes('gem_4')) {
            window.BountyGame.rabbitTokens = (window.BountyGame.rabbitTokens || 0) + 1;
            if (window.updateCounterUI) window.updateCounterUI();
        }
    }, 300000); // 5 minutes

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.updateCurrencyTrees, 200);
    });

})();
