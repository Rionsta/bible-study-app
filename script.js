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


