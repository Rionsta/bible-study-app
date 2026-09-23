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