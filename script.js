let health = 100;

function takeDamage(amount) {
  health = health - amount;
  document.getElementById("health-display").textContent = "Health: " + health;
  console.log(health);
}

takeDamage(20);
takeDamage(10);