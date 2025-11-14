const boostsData = [
  {name:"Bounty doré", desc:"x1.5 sur les clicks", active:false},
  {name:"Employés compétents", desc:"Double le nombre de croquettes par bâtiment avec employé", active:false},
  {name:"Marchand louche", desc:"Double ou perte aléatoire de croquettes", active:false},
  {name:"Alexis de compagnie", desc:"Réduit le prix des 4 premiers bâtiments de 20%", active:false},
  {name:"Augmentation des droits à Bounty", desc:"Boost la rentabilité des croquettes de 5%", active:false},
  {name:"Bonus mystère 1", desc:"+10% click", active:false},
  {name:"Bonus mystère 2", desc:"+20% CPS", active:false},
  {name:"Bonus mystère 3", desc:"+50 croquettes au hasard", active:false},
  {name:"Bonus mystère 4", desc:"Double le multiplicateur temporairement", active:false},
  {name:"Bonus mystère 5", desc:"Réduit le prix du prochain bâtiment", active:false}
];

const boostsDiv = document.getElementById('boostsContainer');

function afficherBoosts(){
  boostsDiv.innerHTML = '';
  boostsData.forEach((b, i)=>{
    const div = document.createElement('div');
    div.textContent = b.name;

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = b.desc;
    div.appendChild(tooltip);

    // clic pour activer
    div.onclick = () => {
      b.active = !b.active;
      div.style.background = b.active ? 'rgba(0,255,0,0.7)' : 'rgba(255,255,255,0.8)';
    };

    boostsDiv.appendChild(div);
  });
}

// === Boosts aléatoires ===
function spawnRandomBoost(){
  const inactiveBoosts = boostsData.filter(b => !b.active);
  if(inactiveBoosts.length === 0) return;

  const b = inactiveBoosts[Math.floor(Math.random() * inactiveBoosts.length)];
  b.active = true;

  // auto désactiver après 20 secondes
  setTimeout(()=>{ b.active=false; afficherBoosts(); }, 20000);

  afficherBoosts();
}

// spawn un boost aléatoire toutes les 30-60 sec
setInterval(() => {
  if(Math.random() < 0.5) spawnRandomBoost();
}, 30000 + Math.random() * 30000);
