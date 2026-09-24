let health = 100;

function takeDamage(amount) {
  health = health - amount;
  if (health < 0) { health = 0; }
  document.getElementById("health-display").textContent = "Health: " + health;
  console.log(health);
}

document.getElementById("damage-button").addEventListener("click", function () {
  takeDamage(10);
})

function heal(amount) {
  health = health + amount;
  document.getElementById("health-display").textContent = "Health: " + health;
  console.log(health);
}

document.getElementById("heal-button").addEventListener("click", function () {
  heal(15);

  
})

function reset(amount) {
  health = amount;
  document.getElementById("health-display").textContent = "Health: " + health;
  console.log(health);
}

document.getElementById("reset-button").addEventListener("click", function () {
  reset(100);
})
;

const cards = document.querySelectorAll(".card");

cards.forEach(function(card) {
  card.addEventListener("click", function() {
    const note = card.querySelector(".reflection-note");
    note.classList.toggle("hidden");
  });
});

document.getElementById("theme-toggle").addEventListener("click", function() {
  document.body.classList.toggle("gaming-theme");

  if (document.body.classList.contains("gaming-theme")) {
    localStorage.setItem("theme", "gaming-theme");
  } else {
    localStorage.setItem("theme", "light");
  }
});

if (localStorage.getItem("theme") === "gaming-theme") {
  document.body.classList.add("gaming-theme");
}

document.querySelectorAll(".reflection-note").forEach(function(note, index) {
  const key = "note-" + index;

  const savedText = localStorage.getItem(key);
  if (savedText) {
    note.value = savedText;
  }

  note.addEventListener("input", function() {
    localStorage.setItem(key, note.value);
  });

  note.addEventListener("click", function(event) {
    event.stopPropagation();
  });
});

const world = document.getElementById("canvas-world");
const viewport = document.getElementById("canvas-viewport");

let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

viewport.addEventListener("mousedown", function(event) {
  isDragging = true;
  startX = event.clientX - offsetX;
  startY = event.clientY - offsetY;
});

viewport.addEventListener("mousemove", function(event) {
  if (isDragging) {
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    world.style.transform = "translate(" + offsetX + "px, " + offsetY + "px)";
  }
});

viewport.addEventListener("mouseup", function() {
  isDragging = false;
});

let activeCard = null;
let cardStartX, cardStartY;

document.querySelectorAll(".card").forEach(function(card) {
  // Restore this card's saved position, if it has one
  const savedLeft = localStorage.getItem(card.id + "-left");
  const savedTop = localStorage.getItem(card.id + "-top");
  if (savedLeft && savedTop) {
    card.style.left = savedLeft;
    card.style.top = savedTop;
  }

  card.addEventListener("mousedown", function(event) {
    event.stopPropagation();
    activeCard = card;
    cardStartX = event.clientX - card.offsetLeft;
    cardStartY = event.clientY - card.offsetTop;
  });
});

document.addEventListener("mouseup", function() {
  if (activeCard) {
    localStorage.setItem(activeCard.id + "-left", activeCard.style.left);
    localStorage.setItem(activeCard.id + "-top", activeCard.style.top);
  }
  activeCard = null;
});

document.addEventListener("mousemove", function(event) {
  if (activeCard) {
    activeCard.style.left = (event.clientX - cardStartX) + "px";
    activeCard.style.top = (event.clientY - cardStartY) + "px";
  }
});

document.addEventListener("mouseup", function() {
  activeCard = null;
});