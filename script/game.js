// === Particules animées ===
const particlesContainer = document.querySelector('.particles');
for (let i = 0; i < 25; i++) {
  const p = document.createElement('div');
  p.classList.add('particle');
  p.style.left = Math.random() * 100 + '%';
  p.style.animationDelay = (Math.random() * 10) + 's';
  p.style.opacity = Math.random();
  const size = Math.random() * 8;
  p.style.width = p.style.height = size + 'px';
  particlesContainer.appendChild(p);
}

// === Variables globales ===
const imgEl = document.getElementById('image');
const sound = document.getElementById('clickSound');
const counterEl = document.getElementById('counter');
const cpsEl = document.getElementById('cps');
let lastIndex = -1;
let count = 0;
let multiplier = 1;
let lastClickTime = 0;
let cps = 0;

// === Fonction pour changer l'image du clic ===
const images = [
  'image/bounty.jpg','image/bounty2.jpg','image/bounty3.jpg',
  'image/bounty4.jpg','image/bounty5.jpg','image/bounty6.jpg',
  'image/bounty7.jpg','image/bounty8.jpg','image/bountygraille.jpg'
];

function pickRandomIndex() {
  let idx;
  do { idx = Math.floor(Math.random() * images.length); }
  while (idx === lastIndex);
  return idx;
}

function changerImage() {
  const idx = pickRandomIndex();
  imgEl.src = images[idx];
  lastIndex = idx;
}

// === Fonction pour jouer le son du clic ===
function jouerSon() {
  sound.currentTime = 0;
  sound.volume = 1.0;
  sound.play().catch(()=>{});
}

// === Animation "+1" sur clic ===
function afficherPlusUn(event) {
  const plusOne = document.createElement('div');
  plusOne.className = 'plus-one';
  const bonus = multiplier;
  const rect = imgEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  plusOne.textContent = `+${Math.floor(bonus)}`;
  plusOne.style.left = `${x-10}px`;
  plusOne.style.top = `${y-20}px`;
  imgEl.parentElement.appendChild(plusOne);
  setTimeout(() => plusOne.remove(), 1000);
}

// === Fonction clic principal ===
function clicBounty(event) {
  const now = Date.now();
  if (now - lastClickTime < 300) return; // limite 0.3s entre clics
  lastClickTime = now;
  
  let bonus = multiplier;

  // Boosts actifs du fichier boosts.js
  if (window.BountyGame && window.BountyGame.boostsData) {
    if (window.BountyGame.boostsData[0].active) bonus *= 1.5; // Bounty doré
    if (window.BountyGame.boostsData[2].active) { 
      if (Math.random() < 0.5) bonus = 0; 
      else bonus *= 2; 
    }
  }

  count += bonus;
  updateCounter();
  changerImage();
  jouerSon();
  afficherPlusUn(event);

  // Mettre à jour shop et boosts
  if (window.BountyGame) {
    if (window.BountyGame.updateStore) window.BountyGame.updateStore();
    if (window.BountyGame.sauvegarderJeu) window.BountyGame.sauvegarderJeu();
  }
}

// === Mise à jour compteur et CPS ===
function updateCounter() {
  counterEl.textContent = `Croquettes : ${Math.floor(count)} (x${multiplier})`;
  cps = calculCPS();
  cpsEl.textContent = `CPS : ${Math.floor(cps)}`;
}

// === Calcul CPS automatique ===
function calculCPS() {
  let total = 0;
  if (!window.BountyGame || !window.BountyGame.storeItemsData) return 0;
  window.BountyGame.storeItemsData.forEach(item => {
    if (item.auto > 0 && item.owned > 0) {
      let gain = item.auto * item.owned;
      // Boosts actifs
      if (window.BountyGame.boostsData[1].active) gain *= 2; // Employés compétents
      if (window.BountyGame.boostsData[4].active) gain *= 1.05; // Augmentation droits
      total += gain;
    }
  });
  return total;
}

// === Reset du jeu ===
function resetJeu() {
  localStorage.removeItem('bountySave');
  count = 0;
  multiplier = 1;
  lastIndex = -1;
  cps = 0;

  // Réinitialiser shop et boosts
  if (window.BountyGame) {
    window.BountyGame.storeItemsData.forEach(item => {
      item.owned = 0;
      item.price = item.price / Math.pow(1.15, item.owned); // recalcul prix
    });
    window.BountyGame.boostsData.forEach(b => b.active = false);
    window.BountyGame.updateStore();
    window.BountyGame.afficherBoosts();
  }

  updateCounter();
  changerImage();
}

// === Intervalle CPS automatique toutes les secondes ===
setInterval(() => {
  if (!window.BountyGame || !window.BountyGame.storeItemsData) return;
  window.BountyGame.storeItemsData.forEach(item => {
    if (item.auto > 0 && item.owned > 0) {
      let gain = item.auto * item.owned;
      if (window.BountyGame.boostsData[1].active) gain *= 2;
      if (window.BountyGame.boostsData[4].active) gain *= 1.05;
      count += gain;
    }
  });
  updateCounter();
  if (window.BountyGame.updateStore) window.BountyGame.updateStore();
}, 1000);

// === Sauvegarde automatique toutes les 60s ===
setInterval(() => {
  if (window.BountyGame && window.BountyGame.sauvegarderJeu) window.BountyGame.sauvegarderJeu();
}, 60000);

// === Initialisation ===
changerImage();
updateCounter();

// === Event listeners ===
imgEl.addEventListener('click', clicBounty);
document.getElementById('resetButton').addEventListener('click', resetJeu);

