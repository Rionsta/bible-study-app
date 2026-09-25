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
    updateWorldTransform();
  }
});

viewport.addEventListener("mouseup", function() {
  isDragging = false;
});

let cardsData = [
  { id: "genesis-card", type: "scripture", reference: "Genesis 1:1", text: "In the beginning, God created the heavens and the earth.", left: 50, top: 50 },
  { id: "psalm-card", type: "scripture", reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.", left: 350, top: 50 },
  { id: "john-card", type: "scripture", reference: "John 3:16", text: "For God so loved the world, that he gave his only Son.", left: 650, top: 50 }
];

const savedData = localStorage.getItem("cardsData");
if (savedData) {
  cardsData = JSON.parse(savedData);
}

function saveCards() {
  localStorage.setItem("cardsData", JSON.stringify(cardsData));
}

let activeCard = null;
let activeCardData = null;
let cardStartX, cardStartY;

function renderCard(data) {
  const card = document.createElement("div");
  card.className = "card";
  card.id = data.id;
  card.style.left = data.left + "px";
  card.style.top = data.top + "px";

  if (data.type === "scripture") {
    const heading = document.createElement("h2");
    heading.textContent = data.reference;
    card.appendChild(heading);

    const paragraph = document.createElement("p");
    paragraph.textContent = data.text;
    card.appendChild(paragraph);
  } else if (data.type === "note") {
    const textarea = document.createElement("textarea");
    textarea.placeholder = "...";
    textarea.value = data.text;

    textarea.addEventListener("mousedown", function(event) {
      event.stopPropagation();
    });

    textarea.addEventListener("input", function() {
      data.text = textarea.value;
      saveCards();
    });

    card.appendChild(textarea);
  }

  const deleteButton = document.createElement("button");
deleteButton.className = "delete-button";
deleteButton.textContent = "×";

deleteButton.addEventListener("mousedown", function(event) {
  event.stopPropagation();
});

deleteButton.addEventListener("click", function() {
  card.remove();
  cardsData = cardsData.filter(function(c) {
    return c.id !== data.id;
  });
  saveCards();
});

card.appendChild(deleteButton);

  card.addEventListener("mousedown", function(event) {
    event.stopPropagation();
    activeCard = card;
    activeCardData = data;
    cardStartX = event.clientX - card.offsetLeft;
    cardStartY = event.clientY - card.offsetTop;
  });

  world.appendChild(card);
}

cardsData.forEach(renderCard);

document.addEventListener("mousemove", function(event) {
  if (activeCard) {
    activeCard.style.left = (event.clientX - cardStartX) + "px";
    activeCard.style.top = (event.clientY - cardStartY) + "px";
  }
});

document.addEventListener("mouseup", function() {
  if (activeCard && activeCardData) {
    activeCardData.left = parseInt(activeCard.style.left);
    activeCardData.top = parseInt(activeCard.style.top);
    saveCards();
  }
  activeCard = null;
  activeCardData = null;
});

let newCardCount = 0;

document.getElementById("add-card-button").addEventListener("click", function() {
  newCardCount++;
  const newData = { id: "note-card-" + newCardCount, type: "note", text: "", left: 100, top: 300 };
  cardsData.push(newData);
  renderCard(newData);
  saveCards();
});

document.getElementById("add-verse-button").addEventListener("click", function() {
  const reference = document.getElementById("verse-input").value;

  fetch("https://bible-api.com/" + encodeURIComponent(reference))
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.error) {
        alert("Couldn't find that verse. Check the reference and try again.");
        return;
      }

      newCardCount++;
      const newData = {
        id: "verse-card-" + newCardCount,
        type: "scripture",
        reference: data.reference,
        text: data.text,
        left: 100 + Math.random() * 200,
        top: 300 + Math.random() * 100
      };
      cardsData.push(newData);
      renderCard(newData);
      saveCards();
    });
});

let zoomLevel = 1;

function updateWorldTransform() {
  world.style.transform = "translate(" + offsetX + "px, " + offsetY + "px) scale(" + zoomLevel + ")";
}

viewport.addEventListener("wheel", function(event) {
  event.preventDefault();

  if (event.deltaY < 0) {
    zoomLevel += 0.1;
  } else {
    zoomLevel -= 0.1;
  }

  if (zoomLevel < 0.2) { zoomLevel = 0.2; }
  if (zoomLevel > 3) { zoomLevel = 3; }

  updateWorldTransform();
});