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

let bibleData = {};
const openBibleButton = document.getElementById("open-bible-button");
openBibleButton.disabled = true;

fetch("bible-data.json")
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    bibleData = data;
    openBibleButton.disabled = false;
    cardsData.forEach(renderCard);
  });

let isDragging = false;
let startX, startY;
let offsetX = parseFloat(localStorage.getItem("offsetX")) || 0;
let offsetY = parseFloat(localStorage.getItem("offsetY")) || 0;

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
  localStorage.setItem("offsetX", offsetX);
  localStorage.setItem("offsetY", offsetY);
});

document.addEventListener("mousemove", function(event) {
  if (activeResizeCard) {
    const newWidth = startWidth + (event.clientX - resizeStartX);
    const newHeight = startHeight + (event.clientY - resizeStartY);
    if (newWidth > 100) { activeResizeCard.style.width = newWidth + "px"; }
    if (newHeight > 80) { activeResizeCard.style.height = newHeight + "px"; }
  }
});

document.addEventListener("mouseup", function() {
  if (activeResizeCard && activeResizeCardData) {
    activeResizeCardData.width = parseInt(activeResizeCard.style.width);
    activeResizeCardData.height = parseInt(activeResizeCard.style.height);
    saveCards();
  }
  activeResizeCard = null;
  activeResizeCardData = null;
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
let activeResizeCard = null;
let activeResizeCardData = null;
let resizeStartX = 0;
let resizeStartY = 0;
let startWidth = 0;
let startHeight = 0;

function renderCard(data) {
  const card = document.createElement("div");
  card.className = "card";
  card.id = data.id;
  card.style.left = data.left + "px";
  card.style.top = data.top + "px";

  if (data.width) { card.style.width = data.width + "px"; }
if (data.height) { card.style.height = data.height + "px"; }

const cardContent = document.createElement("div");
cardContent.className = "card-content";
card.appendChild(cardContent);

  if (data.type === "scripture") {
    const heading = document.createElement("h2");
    heading.textContent = data.reference;
    cardContent.appendChild(heading);

    const paragraph = document.createElement("p");
    paragraph.textContent = data.text;
    cardContent.appendChild(paragraph);
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

    cardContent.appendChild(textarea);
  } else if (data.type === "bible-reader") {
  card.classList.add("bible-reader");

  const bookSelect = document.createElement("select");
  Object.keys(bibleData).forEach(function(bookName) {
    const option = document.createElement("option");
    option.value = bookName;
    option.textContent = bookName;
    bookSelect.appendChild(option);
  });

  const chapterSelect = document.createElement("select");
  const textDisplay = document.createElement("div");
  textDisplay.className = "reader-text";

  function renderChapter(book, chapter) {
  textDisplay.innerHTML = "";
  const verses = bibleData[book][chapter];
  Object.keys(verses).forEach(function(verseNumber) {
    const versePara = document.createElement("p");
    versePara.textContent = verseNumber + " " + verses[verseNumber];
    versePara.className = "pullable-verse";

    versePara.addEventListener("mousedown", function(event) {
      event.stopPropagation();
    });

    versePara.addEventListener("click", function() {
      const reference = book + " " + chapter + ":" + verseNumber;
      addVerseCard(reference, verses[verseNumber]);
    });

    textDisplay.appendChild(versePara);
  });
}

  const lockButton = document.createElement("button");
lockButton.className = "lock-toggle";
lockButton.textContent = data.locked ? "🔒" : "🔓";

lockButton.addEventListener("mousedown", function(event) {
  event.stopPropagation();
});

lockButton.addEventListener("click", function() {
  data.locked = !data.locked;
  lockButton.textContent = data.locked ? "🔒" : "🔓";
  saveCards();
});

card.appendChild(lockButton);

  function populateChapters(book) {
    chapterSelect.innerHTML = "";
    Object.keys(bibleData[book]).forEach(function(chapterNumber) {
      const option = document.createElement("option");
      option.value = chapterNumber;
      option.textContent = "Chapter " + chapterNumber;
      chapterSelect.appendChild(option);
    });
    renderChapter(book, chapterSelect.value);
  }

  bookSelect.addEventListener("mousedown", function(event) {
    event.stopPropagation();
  });
  bookSelect.addEventListener("change", function() {
    populateChapters(bookSelect.value);
  });

  chapterSelect.addEventListener("mousedown", function(event) {
    event.stopPropagation();
  });
  chapterSelect.addEventListener("change", function() {
    renderChapter(bookSelect.value, chapterSelect.value);
  });

  cardContent.appendChild(bookSelect);
  cardContent.appendChild(chapterSelect);
  cardContent.appendChild(textDisplay);

  populateChapters(bookSelect.value);
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
    if (data.locked) { return; }
    event.stopPropagation();
    activeCard = card;
    activeCardData = data;
    cardStartX = event.clientX - card.offsetLeft;
    cardStartY = event.clientY - card.offsetTop;
  });

  world.appendChild(card);

  const resizeHandle = document.createElement("div");
resizeHandle.className = "resize-handle";

resizeHandle.addEventListener("mousedown", function(event) {
  event.stopPropagation();
  activeResizeCard = card;
  activeResizeCardData = data;
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  startWidth = card.offsetWidth;
  startHeight = card.offsetHeight;
});

card.appendChild(resizeHandle);
}

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

  getVerseData(reference).then(function(result) {
    if (!result) {
      alert("Couldn't find that verse. Check the reference and try again.");
      return;
    }
    addVerseCard(result.reference, result.text);
  });
});

let zoomLevel = parseFloat(localStorage.getItem("zoomLevel")) || 1;

function updateWorldTransform() {
  world.style.transform = "translate(" + offsetX + "px, " + offsetY + "px) scale(" + zoomLevel + ")";
}

viewport.addEventListener("wheel", function(event) {
  if (event.target.closest(".card")) {
    return;
  }
  if (event.deltaY < 0) {
    zoomLevel += 0.1;
  } else {
    zoomLevel -= 0.1;
  }

  if (zoomLevel < 0.2) { zoomLevel = 0.2; }
  if (zoomLevel > 3) { zoomLevel = 3; }

  localStorage.setItem("zoomLevel", zoomLevel);
  updateWorldTransform();
});

function findOfflineVerse(reference) {
  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  const book = match[1];
  const chapter = match[2];
  const verse = match[3];

  if (bibleData[book] && bibleData[book][chapter] && bibleData[book][chapter][verse]) {
    return {
      reference: reference,
      text: bibleData[book][chapter][verse]
    };
  }

  return null;
}

function addVerseCard(reference, text) {
  newCardCount++;
  const newData = {
    id: "verse-card-" + newCardCount,
    type: "scripture",
    reference: reference,
    text: text,
    left: 100 + Math.random() * 200,
    top: 300 + Math.random() * 100
  };
  cardsData.push(newData);
  renderCard(newData);
  saveCards();
}

function getVerseData(reference) {
  const offlineMatch = findOfflineVerse(reference);
  if (offlineMatch) {
    return Promise.resolve(offlineMatch);
  }

  return fetch("https://bible-api.com/" + encodeURIComponent(reference))
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.error) {
        return null;
      }
      return { reference: data.reference, text: data.text };
    });
}

document.getElementById("open-bible-button").addEventListener("click", function() {
  newCardCount++;
  const newData = {
    id: "bible-reader-" + newCardCount,
    type: "bible-reader",
    left: 150,
    top: 150
  };
  cardsData.push(newData);
  renderCard(newData);
  saveCards();
});

updateWorldTransform();