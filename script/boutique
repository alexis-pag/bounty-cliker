// === Données Shop ===
const storeItemsData = [
  {name:"Gamelle de croquette", price:10, mult:1, auto:0, owned:0, icon:'image/gamelle.png'},
  {name:"Cage à croquette", price:25, mult:0, auto:0, owned:0, icon:'image/cage.png'},
  {name:"Paquet de croquette", price:50, mult:0, auto:1, owned:0, icon:'image/paquet.png'},
  {name:"Magasin de croquettes", price:200, mult:0, auto:5, owned:0, icon:'image/magasin.png'},
  {name:"Supermarcher de croquette", price:500, mult:0, auto:10, owned:0, icon:'image/supermarche.png'},
  {name:"Hypermarcher de croquettes", price:1000, mult:0, auto:20, owned:0, icon:'image/hypermarcher.png'},
  {name:"Entrepot de croquettes", price:5000, mult:0, auto:50, owned:0, icon:'image/entrepot.png'},
  {name:"Usine de croquettes", price:10000, mult:0, auto:100, owned:0, icon:'image/usine.png'},
  {name:"Temple à croquettes", price:50000, mult:0, auto:300, owned:0, icon:'image/temple.png'},
  {name:"Dimension de croquettes", price:50000, mult:0, auto:500, owned:0, icon:'image/dimension.png'},
  {name:"Univers de croquettes", price:100000, mult:0, auto:1000, owned:0, icon:'image/univers.png'},
  {name:"Galaxy de croquettes", price:500000, mult:0, auto:5000, owned:0, icon:'image/galaxy.png'}
];

const storeDiv = document.getElementById('storeItems');

// === Affichage du shop ===
function updateStore() {
  storeDiv.innerHTML = '';
  storeItemsData.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name} (${Math.floor(item.price)} croquettes)`;

    const btn = document.createElement('button');
    btn.textContent = 'Acheter';
    btn.disabled = count < item.price;
    btn.onclick = () => acheterItem(index);

    const iconContainer = document.createElement('div');
    iconContainer.className = 'building-icon-container';
    const img = document.createElement('img');
    img.src = item.icon;
    const countDiv = document.createElement('div');
    countDiv.className = 'building-count';
    countDiv.textContent = item.owned;

    iconContainer.appendChild(img);
    iconContainer.appendChild(countDiv);
    itemDiv.appendChild(nameSpan);
    itemDiv.appendChild(btn);
    itemDiv.appendChild(iconContainer);

    // Tooltip
    itemDiv.title = `Génère ${item.auto} CPS et x${item.mult} par clic`;

    storeDiv.appendChild(itemDiv);
  });
}

// === Acheter un bâtiment ===
function acheterItem(index){
  const item = storeItemsData[index];
  if(count >= item.price){
    count -= item.price;
    if(item.mult > 0) multiplier += item.mult;
    if(boostsData[3].active && index < 4) item.price *= 0.8;
    item.owned += 1;
    item.price *= 1.15;

    // Flash animation
    const itemDiv = storeDiv.children[index];
    const flash = document.createElement('div');
    flash.className = 'flash';
    flash.style.left = (itemDiv.offsetWidth / 2 - 15) + 'px';
    flash.style.top = (itemDiv.offsetHeight / 2 - 15) + 'px';
    itemDiv.appendChild(flash);
    setTimeout(()=>flash.remove(), 500);

    updateCounter();
    updateStore();
    sauvegarderJeu();
  }
}
