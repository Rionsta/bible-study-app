let health = 100;

function takeDamage(amount) {
  health = health - amount;
  console.log(health);
}

takeDamage(20);
takeDamage(10);