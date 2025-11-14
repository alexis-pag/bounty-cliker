window.boostsData = [
  {name:"Bounty doré",desc:"x1.5 sur les clicks",active:false},
  {name:"Employés compétents",desc:"Double le nombre de croquettes par bâtiment",active:false},
  {name:"Marchand louche",desc:"Double ou perte aléatoire de croquettes",active:false},
  {name:"Alexis de compagnie",desc:"Réduit le prix des 4 premiers bâtiments de 20%",active:false},
  {name:"Augmentation des droits à Bounty",desc:"Boost la rentabilité des croquettes de 5%",active:false},
  {name:"Bonus mystère 1",desc:"+10% click",active:false},
  {name:"Bonus mystère 2",desc:"+20% CPS",active:false},
  {name:"Bonus mystère 3",desc:"+50 croquettes au hasard",active:false},
  {name:"Bonus mystère 4",desc:"Double le multiplicateur temporairement",active:false},
  {name:"Bonus mystère 5",desc:"Réduit le prix du prochain bâtiment",active:false}
];

const boostsDiv = document.getElementById('boostsContainer');

function afficherBoosts(){
  boostsDiv.innerHTML='';
  window.boostsData.forEach((b,i)=>{
    const div=document.createElement('div');
    div.textContent=b.name;
    const tooltip=document.createElement('span');
    tooltip.className='tooltip';
    tooltip.textContent=b.desc;
    div.appendChild(tooltip);
    div.onclick=()=>{ 
      b.active=!b.active;
      div.style.background=b.active?'rgba(0,255,0,0.7)':'rgba(255,255,255,0.8)';
    };
    boostsDiv.appendChild(div);
  });
}

// Gestion aléatoire des boosts
function spawnBoost(){
  const index = Math.floor(Math.random()*window.boostsData.length);
  window.boostsData[index].active=false;
  afficherBoosts();
  setTimeout(spawnBoost, 20000 + Math.random()*40000); // réapparition aléatoire
}
spawnBoost();
