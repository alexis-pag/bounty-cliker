/* boosts.js
   - defines boostsData, afficherBoosts, and random spawn/temporary availability
*/
(() => {
  window.boostsData = [
    {name:"Bounty doré",desc:"x1.5 sur les clicks",active:false,available:true},
    {name:"Employés compétents",desc:"Double le nombre de croquettes par bâtiment",active:false,available:true},
    {name:"Marchand louche",desc:"Double ou perte aléatoire de croquettes",active:false,available:true},
    {name:"Alexis de compagnie",desc:"Réduit le prix des 4 premiers bâtiments de 20%",active:false,available:true},
    {name:"Augmentation des droits à Bounty",desc:"Boost la rentabilité des croquettes de 5%",active:false,available:true},
    {name:"Bonus mystère 1",desc:"+10% click",active:false,available:true},
    {name:"Bonus mystère 2",desc:"+20% CPS",active:false,available:true},
    {name:"Bonus mystère 3",desc:"+50 croquettes au hasard",active:false,available:true},
    {name:"Bonus mystère 4",desc:"Double le multiplicateur temporairement",active:false,available:true},
    {name:"Bonus mystère 5",desc:"Réduit le prix du prochain bâtiment",active:false,available:true}
  ];

  const boostsDiv = document.getElementById('boostsContainer');

  function makeBoostNode(b, i){
    const root = document.createElement('div');
    root.className = 'boost';
    root.style.display = b.available ? 'flex' : 'none';

    const tleft = document.createElement('div'); tleft.innerHTML = `<strong>${b.name}</strong>`;
    const tright = document.createElement('div');
    const btn = document.createElement('button'); btn.textContent = b.active ? 'ON' : 'Activer';
    btn.style.padding = '6px 10px';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      b.active = !b.active;
      if(window.afficherBoosts) window.afficherBoosts();
      if(window.sauvegarderJeu) window.sauvegarderJeu();
    });

    const tooltip = document.createElement('div'); tooltip.className = 'tooltip'; tooltip.textContent = b.desc;
    root.appendChild(tleft); root.appendChild(tright); tright.appendChild(btn); root.appendChild(tooltip);

    // visual for active
    root.style.borderLeft = b.active ? `4px solid rgba(0,200,120,0.95)` : 'none';
    return root;
  }

  function afficherBoosts(){
    boostsDiv.innerHTML = '';
    window.boostsData.forEach((b,i)=>{
      const node = makeBoostNode(b,i);
      boostsDiv.appendChild(node);
    });
  }

  // spawn algorithm:
  // periodically choose 1-2 boosts to make available (others hidden),
  // each available boost auto-disappears after a duration; occasional "rare" flash.
  function scheduleSpawn(){
    // hide all then pick random subset
    window.boostsData.forEach(b => b.available = false);

    // number available: 1 or 2 (rarely 3)
    const n = (Math.random() < 0.07) ? 3 : ((Math.random() < 0.25) ? 2 : 1);
    const pool = window.boostsData.slice();
    for(let i=0;i<n;i++){
      if(pool.length === 0) break;
      const idx = Math.floor(Math.random()*pool.length);
      const chosen = pool.splice(idx,1)[0];
      chosen.available = true;
      // rare visual flash flag (we'll style node on render if chosen.rare)
      if(Math.random() < 0.08) chosen.rare = true; else chosen.rare = false;

      // schedule disappearance for this chosen
      const duration = 10000 + Math.random()*25000; // 10-35s
      setTimeout(() => {
        chosen.available = false;
        chosen.rare = false;
        if(window.afficherBoosts) window.afficherBoosts();
      }, duration);
    }

    if(window.afficherBoosts) window.afficherBoosts();

    // schedule next spawn after 12-40s
    const nextIn = 12000 + Math.random()*28000;
    setTimeout(scheduleSpawn, nextIn);
  }

  // initial render + start spawns
  document.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(()=> {
      afficherBoosts();
      setTimeout(scheduleSpawn, 2000 + Math.random()*3000);
    }, 60);
  });

  // expose function
  window.afficherBoosts = afficherBoosts;
})();
