let count = 0;
let cps = 0;

let clickValue = 1;     // valeur de base
let addClickBonus = 0;  // +1 item
let addCageBonus = 0;   // +5 item

const counter = document.getElementById("counter");
const cpsDisplay = document.getElementById("cps");
const img = document.getElementById("image");
const clickSound = document.getElementById("clickSound");

function updateUI() {
    counter.textContent = "Croquettes : " + count;
    cpsDisplay.textContent = "CPS : " + cps;
}

/* CLICK */
img.addEventListener("click", (e) => {
    clickSound.currentTime = 0;
    clickSound.play();

    let gain = clickValue + addClickBonus + addCageBonus;
    count += gain;

    spawnPlusOne(e.clientX, e.clientY, gain);
    updateUI();
});

/* ANIMATION */
function spawnPlusOne(x, y, gain){
    const p = document.createElement("div");
    p.className = "plus-one";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.textContent = "+" + gain;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
}

/* AUTO CPS */
setInterval(() => {
    count += cps;
    updateUI();
}, 1000);

/* RESET */
document.getElementById("resetButton").addEventListener("click", () => {
    count = 0;
    cps = 0;
    clickValue = 1;
    addClickBonus = 0;
    addCageBonus = 0;

    updateUI();
});
document.addEventListener('DOMContentLoaded', () => {
  const shopPanel = document.querySelector('.shop');
  const shopHeader = shopPanel.querySelector('.panel-header');

  // bascule ouverture/fermeture
  shopHeader.addEventListener('click', () => {
    shopPanel.classList.toggle('open');
  });

  // shop fermé au début
  shopPanel.classList.remove('open');
});
