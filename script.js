const APP_STATE_KEY = "appState";

function loadAppState() {
  const saved = localStorage.getItem(APP_STATE_KEY);
  if (saved) {
    const state = JSON.parse(saved);
    Object.values(state.boards).forEach(function(board) {
      if (!board.drawings) { board.drawings = []; }
    });
    return state;
  }

// No new-format save yet — pull in whatever old data exists so it isn't lost
const oldCards = localStorage.getItem("cardsData");
const oldZoom = parseFloat(localStorage.getItem("zoomLevel")) || 1;
const oldOffsetX = parseFloat(localStorage.getItem("offsetX")) || 0;
const oldOffsetY = parseFloat(localStorage.getItem("offsetY")) || 0;

  const defaultCards = [
    { id: "genesis-card", type: "scripture", reference: "Genesis 1:1", text: "In the beginning, God created the heavens and the earth.", left: 50, top: 50 },
    { id: "psalm-card", type: "scripture", reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.", left: 350, top: 50 },
    { id: "john-card", type: "scripture", reference: "John 3:16", text: "For God so loved the world, that he gave his only Son.", left: 650, top: 50 }
  ];

  return {
    activeBoardId: "board-1",
    boards: {
      "board-1": {
        id: "board-1",
        name: "My First Board",
        pan: { offsetX: oldOffsetX, offsetY: oldOffsetY },
        zoom: oldZoom,
        cards: oldCards ? JSON.parse(oldCards) : defaultCards,
        connections: [],
        drawings: []
      }
    },
    highlights: {},
    globalHud: {
      prayerRequests: [],
      questions: [],
      dailyQuests: []
    }
  };
}

function saveAppState() {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
}

let appState = loadAppState();

function getActiveBoard() {
  return appState.boards[appState.activeBoardId];
}

function renderGlobalHud() {
  const list = document.getElementById("hud-list");
  list.innerHTML = "";

  function addHudItem(icon, item) {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = icon + " " + item.text;
    li.appendChild(textSpan);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", function() {
      appState.globalHud.prayerRequests = appState.globalHud.prayerRequests.filter(function(p) {
        return p.id !== item.id;
      });
      appState.globalHud.questions = appState.globalHud.questions.filter(function(q) {
        return q.id !== item.id;
      });
      saveAppState();
      renderGlobalHud();
    });
    li.appendChild(deleteButton);

    list.appendChild(li);
  }

  appState.globalHud.prayerRequests.forEach(function(item) {
    addHudItem("🙏", item);
  });

  appState.globalHud.questions.forEach(function(item) {
    addHudItem("❓", item);
  });
}

document.getElementById("add-prayer-button").addEventListener("click", function() {
  const input = document.getElementById("hud-input");
  if (!input.value) { return; }

  appState.globalHud.prayerRequests.push({
    id: "prayer-" + Date.now(),
    text: input.value
  });

  input.value = "";
  saveAppState();
  renderGlobalHud();
});

document.getElementById("add-question-button").addEventListener("click", function() {
  const input = document.getElementById("hud-input");
  if (!input.value) { return; }

  appState.globalHud.questions.push({
    id: "question-" + Date.now(),
    text: input.value
  });

  input.value = "";
  saveAppState();
  renderGlobalHud();
});

function renderBoard() {
  world.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "connections-svg";
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.overflow = "visible";
  svg.style.pointerEvents = "none";
  world.appendChild(svg);

  const drawingsSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  drawingsSvg.id = "drawings-svg";
  drawingsSvg.style.position = "absolute";
  drawingsSvg.style.top = "0";
  drawingsSvg.style.left = "0";
  drawingsSvg.style.overflow = "visible";
  drawingsSvg.style.pointerEvents = "none";
  world.appendChild(drawingsSvg);

  getActiveBoard().cards.forEach(renderCard);
  updateWorldTransform();
  renderConnections();
  renderDrawings();
}

function switchBoard(boardId) {
  appState.activeBoardId = boardId;
  renderBoard();
  renderBoardSwitcher();
  saveAppState();
}

function randomOffset() {
  return { x: Math.random() * 200, y: Math.random() * 100 };
}

let activeTool = "select";

function setActiveTool(tool) {
  activeTool = tool;
  pendingConnectionCardId = null;
  document.querySelectorAll(".tool-button").forEach(function(button) {
    button.classList.remove("active");
  });
  document.getElementById("tool-" + tool).classList.add("active");
}

document.getElementById("tool-select").addEventListener("click", function() {
  setActiveTool("select");
});
document.getElementById("tool-highlight").addEventListener("click", function() {
  setActiveTool("highlight");
});

function toggleHighlight(verseId) {
  if (appState.highlights[verseId]) {
    delete appState.highlights[verseId];
  } else {
    appState.highlights[verseId] = { color: "yellow" };
  }
  saveAppState();
}

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
    renderBoard();
  });

let isDragging = false;
let startX, startY;

const bibleMaps = [
  {
    group: "Genesis & Patriarchs",
    maps: [
      { name: "The Ancient Near East & Fertile Crescent", src: "images/maps/ancient-near-east.jpg" }
    ]
  },
  {
    group: "The Gospels & Life of Christ",
    maps: [
      { name: "Palestine in the Time of Jesus", src: "images/maps/palestine-time-of-jesus.jpg" }
    ]
  }
];

viewport.addEventListener("mousedown", function(event) {
  if (activeTool === "pen") {
    isPenDrawing = true;
    currentDrawingPoints = [screenToWorld(event)];
    return;
  }

  isDragging = true;
  startX = event.clientX - getActiveBoard().pan.offsetX;
  startY = event.clientY - getActiveBoard().pan.offsetY;
});

viewport.addEventListener("mousemove", function(event) {
  if (activeTool === "pen") {
    if (isPenDrawing) {
      currentDrawingPoints.push(screenToWorld(event));
      renderDrawings();
    }
    return;
  }

  if (isDragging) {
    getActiveBoard().pan.offsetX = event.clientX - startX;
    getActiveBoard().pan.offsetY = event.clientY - startY;
    updateWorldTransform();
  }
});

viewport.addEventListener("mouseup", function() {
  if (activeTool === "pen") {
    return;
  }

  isDragging = false;
  saveAppState();
});

document.addEventListener("mouseup", function() {
  if (!isPenDrawing) { return; }

  if (currentDrawingPoints && currentDrawingPoints.length > 1) {
    getActiveBoard().drawings.push({
      id: "drawing-" + Date.now(),
      points: currentDrawingPoints
    });
    saveAppState();
  }

  isPenDrawing = false;
  currentDrawingPoints = null;
  renderDrawings();
});

document.addEventListener("mousemove", function(event) {
  if (activeResizeCard) {
    const newWidth = startWidth + (event.clientX - resizeStartX);
    const newHeight = startHeight + (event.clientY - resizeStartY);
    if (newWidth > 100) { activeResizeCard.style.width = newWidth + "px"; }
    if (newHeight > 80) { activeResizeCard.style.height = newHeight + "px"; }
    renderConnections();
  }
});

document.addEventListener("mouseup", function() {
  if (activeResizeCard && activeResizeCardData) {
    activeResizeCardData.width = parseInt(activeResizeCard.style.width);
    activeResizeCardData.height = parseInt(activeResizeCard.style.height);
    saveAppState();
  }
  activeResizeCard = null;
  activeResizeCardData = null;
});

const stickyColors = [
  "#FFF2A6", "#FFC93C", "#FFA857", "#FF6F61",
  "#FFC2E6", "#FF4FC0", "#AFD4FF", "#8C8CF0",
  "#9FEFF0", "#4C8CF5", "#4FD9B0", "#34C77B",
  "#C6EFA0", "#A6D93C", "#F0F0F0", "#1A1A1A"
];

function isDarkColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
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
    card.classList.add("sticky-note");

    if (!data.color) {
      data.color = stickyColors[0];
    }
    card.style.backgroundColor = data.color;
    card.style.color = isDarkColor(data.color) ? "#f5f5f5" : "#23262b";

    const colorPicker = document.createElement("div");
    colorPicker.className = "color-picker";
    colorPicker.style.display = "none";

    stickyColors.forEach(function(color) {
      const swatch = document.createElement("span");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = color;

      swatch.addEventListener("mousedown", function(event) {
        event.stopPropagation();
      });

      swatch.addEventListener("click", function() {
        data.color = color;
        card.style.backgroundColor = color;
        card.style.color = isDarkColor(color) ? "#f5f5f5" : "#23262b";
        colorPicker.style.display = "none";
        saveAppState();
      });

      colorPicker.appendChild(swatch);
    });

    const paletteButton = document.createElement("button");
    paletteButton.className = "palette-toggle";
    paletteButton.textContent = "🎨";

    paletteButton.addEventListener("mousedown", function(event) {
      event.stopPropagation();
    });

    paletteButton.addEventListener("click", function() {
      colorPicker.style.display = colorPicker.style.display === "none" ? "flex" : "none";
    });

    card.appendChild(paletteButton);
    cardContent.appendChild(colorPicker);

    const textarea = document.createElement("textarea");
    textarea.placeholder = "...";
    textarea.value = data.text;

    textarea.addEventListener("mousedown", function(event) {
      event.stopPropagation();
    });

    textarea.addEventListener("input", function() {
      data.text = textarea.value;
      saveAppState();
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
    const verseId = book + "." + chapter + "." + verseNumber;

    const versePara = document.createElement("p");
    versePara.textContent = verseNumber + " " + verses[verseNumber];
    versePara.className = "pullable-verse";

    if (appState.highlights[verseId]) {
      versePara.classList.add("highlighted-verse");
    }

    versePara.addEventListener("mousedown", function(event) {
      event.stopPropagation();
    });

    versePara.addEventListener("click", function() {
      if (activeTool === "highlight") {
        toggleHighlight(verseId);
        renderChapter(book, chapter);
        return;
      }

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
  saveAppState();
});

card.appendChild(lockButton);

  function populateChapters(book, selectedChapter) {
  chapterSelect.innerHTML = "";
  Object.keys(bibleData[book]).forEach(function(chapterNumber) {
    const option = document.createElement("option");
    option.value = chapterNumber;
    option.textContent = "Chapter " + chapterNumber;
    chapterSelect.appendChild(option);
  });

  chapterSelect.value = selectedChapter || chapterSelect.value;
  renderChapter(book, chapterSelect.value);
}

bookSelect.addEventListener("change", function() {
  data.book = bookSelect.value;
  data.chapter = null;
  saveAppState();
  populateChapters(bookSelect.value);
});

chapterSelect.addEventListener("change", function() {
  data.chapter = chapterSelect.value;
  saveAppState();
  renderChapter(bookSelect.value, chapterSelect.value);
});

cardContent.appendChild(bookSelect);
cardContent.appendChild(chapterSelect);
cardContent.appendChild(textDisplay);

if (data.book) {
  bookSelect.value = data.book;
}
populateChapters(bookSelect.value, data.chapter);

} else if (data.type === "map") {
  const mapSelect = document.createElement("select");

  bibleMaps.forEach(function(group) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.group;

    group.maps.forEach(function(map) {
      const option = document.createElement("option");
      option.value = map.src;
      option.textContent = map.name;
      optgroup.appendChild(option);
    });

    mapSelect.appendChild(optgroup);
  });

  if (!data.mapSrc) {
    data.mapSrc = bibleMaps[0].maps[0].src;
  }
  mapSelect.value = data.mapSrc;

  const mapImage = document.createElement("img");
  mapImage.className = "map-image";
  mapImage.src = data.mapSrc;

  mapSelect.addEventListener("mousedown", function(event) {
    event.stopPropagation();
  });

  mapSelect.addEventListener("change", function() {
    data.mapSrc = mapSelect.value;
    mapImage.src = mapSelect.value;
    saveAppState();
  });

  cardContent.appendChild(mapSelect);
  cardContent.appendChild(mapImage);
} else if (data.type === "zone") {
  card.classList.add("zone");
  card.classList.add(data.label.toLowerCase());

  const zoneLabel = document.createElement("div");
  zoneLabel.className = "zone-label";
  zoneLabel.textContent = data.label;
  cardContent.appendChild(zoneLabel);
}

  const deleteButton = document.createElement("button");
deleteButton.className = "delete-button";
deleteButton.textContent = "×";

deleteButton.addEventListener("mousedown", function(event) {
  event.stopPropagation();
});

deleteButton.addEventListener("click", function() {
  card.remove();
  getActiveBoard().cards = getActiveBoard().cards.filter(function(c) {
    return c.id !== data.id;
  });
  getActiveBoard().connections = getActiveBoard().connections.filter(function(connection) {
    return connection.cardAId !== data.id && connection.cardBId !== data.id;
  });
  saveAppState();
  renderConnections();
});

card.addEventListener("mousedown", function(event) {
  if (data.locked) { return; }
  event.stopPropagation();

  if (activeTool === "connect") {
    handleConnectClick(data.id);
    return;
  }

  activeCard = card;
  activeCardData = data;
  cardStartX = event.clientX - card.offsetLeft;
  cardStartY = event.clientY - card.offsetTop;
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
    renderConnections();
  }
});

document.addEventListener("mouseup", function() {
  if (activeCard && activeCardData) {
    activeCardData.left = parseInt(activeCard.style.left);
    activeCardData.top = parseInt(activeCard.style.top);
    saveAppState();
  }
  activeCard = null;
  activeCardData = null;
});

let newCardCount = 0;

document.getElementById("add-card-button").addEventListener("click", function() {
  newCardCount++;
  const offset = randomOffset();
  const newData = { id: "note-card-" + Date.now(), type: "note", text: "", left: 150 + offset.x, top: 150 + offset.y };
  getActiveBoard().cards.push(newData);
  renderCard(newData);
  saveAppState();
});

document.getElementById("add-map-button").addEventListener("click", function() {
  newCardCount++;
  const offset = randomOffset();
  const newData = {
    id: "map-card-" + Date.now(),
    type: "map",
    left: 150 + offset.x,
    top: 150 + offset.y
  };
  getActiveBoard().cards.push(newData);
  renderCard(newData);
  saveAppState();
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

function updateWorldTransform() {
  world.style.transform = "translate(" + getActiveBoard().pan.offsetX + "px, " + getActiveBoard().pan.offsetY + "px) scale(" + getActiveBoard().zoom + ")";
}

viewport.addEventListener("wheel", function(event) {
  if (event.target.closest(".card")) {
    return;
  }
  if (event.deltaY < 0) {
    getActiveBoard().zoom += 0.1;
  } else {
    getActiveBoard().zoom -= 0.1;
  }

  if (getActiveBoard().zoom < 0.2) { getActiveBoard().zoom = 0.2; }
  if (getActiveBoard().zoom > 3) { getActiveBoard().zoom = 3; }

  saveAppState();
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
    id: "verse-card-" + Date.now(),
    type: "scripture",
    reference: reference,
    text: text,
    left: 100 + Math.random() * 200,
    top: 300 + Math.random() * 100
  };
  getActiveBoard().cards.push(newData);
  renderCard(newData);
  saveAppState();
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
  const offset = randomOffset();
  const newData = {
    id: "bible-reader-" + Date.now(),
    type: "bible-reader",
    left: 150 + offset.x,
    top: 150 + offset.y
  };
  getActiveBoard().cards.push(newData);
  renderCard(newData);
  saveAppState();
});

updateWorldTransform();
renderBoardSwitcher();
renderGlobalHud();

function addZoneCard(label) {
  newCardCount++;
  const offset = randomOffset();
  const newData = {
    id: "zone-card-" + Date.now(),
    type: "zone",
    label: label,
    left: 150 + offset.x,
    top: 150 + offset.y,
    width: 400,
    height: 300
  };
  getActiveBoard().cards.push(newData);
  renderCard(newData);
  saveAppState();
}

document.getElementById("add-observation-button").addEventListener("click", function() {
  addZoneCard("Observation");
});

document.getElementById("add-interpretation-button").addEventListener("click", function() {
  addZoneCard("Interpretation");
});

document.getElementById("add-application-button").addEventListener("click", function() {
  addZoneCard("Application");
});

document.getElementById("rename-board-button").addEventListener("click", function() {
  const newName = prompt("Rename this board:", getActiveBoard().name);
  if (!newName) { return; }

  getActiveBoard().name = newName;
  renderBoardSwitcher();
  saveAppState();
});

document.getElementById("delete-board-button").addEventListener("click", function() {
  const boardIds = Object.keys(appState.boards);
  if (boardIds.length <= 1) {
    alert("You can't delete your only board.");
    return;
  }

  

  const confirmed = confirm("Delete \"" + getActiveBoard().name + "\"? This can't be undone.");
  if (!confirmed) { return; }

  delete appState.boards[appState.activeBoardId];

  const remainingId = Object.keys(appState.boards)[0];
  switchBoard(remainingId);
});

document.getElementById("add-board-button").addEventListener("click", function() {
  const name = prompt("Name this board:");
  if (name) {
    createBoard(name);
  }
});

document.getElementById("board-switcher").addEventListener("change", function() {
  switchBoard(this.value);
});

function createBoard(name) {
  const newId = "board-" + Date.now();

  appState.boards[newId] = {
    id: newId,
    name: name,
    pan: { offsetX: 0, offsetY: 0 },
    zoom: 1,
    cards: [],
    connections: [],
    drawings: []
  };

  switchBoard(newId);
}

function renderBoardSwitcher() {
  const switcher = document.getElementById("board-switcher");
  switcher.innerHTML = "";

  Object.values(appState.boards).forEach(function(board) {
    const option = document.createElement("option");
    option.value = board.id;
    option.textContent = board.name;
    switcher.appendChild(option);
  });

  switcher.value = appState.activeBoardId;
}

let pendingConnectionCardId = null;

document.getElementById("tool-connect").addEventListener("click", function() {
  setActiveTool("connect");
});
document.getElementById("tool-pen").addEventListener("click", function() {
  setActiveTool("pen");
});

let isPenDrawing = false;
let currentDrawingPoints = null;

function screenToWorld(event) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - getActiveBoard().pan.offsetX) / getActiveBoard().zoom,
    y: (event.clientY - rect.top - getActiveBoard().pan.offsetY) / getActiveBoard().zoom
  };
}

function renderDrawings() {
  const svg = document.getElementById("drawings-svg");
  if (!svg) { return; }
  svg.innerHTML = "";

  function drawPolyline(points) {
    const pointsAttr = points.map(function(point) {
      return point.x + "," + point.y;
    }).join(" ");

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", pointsAttr);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#e63946");
    polyline.setAttribute("stroke-width", "3");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    svg.appendChild(polyline);
  }

  getActiveBoard().drawings.forEach(function(drawing) {
    drawPolyline(drawing.points);
  });

  if (currentDrawingPoints && currentDrawingPoints.length > 1) {
    drawPolyline(currentDrawingPoints);
  }
}

function handleConnectClick(cardId) {
  if (!pendingConnectionCardId) {
    pendingConnectionCardId = cardId;
    return;
  }

  if (pendingConnectionCardId === cardId) {
    pendingConnectionCardId = null;
    return;
  }

  getActiveBoard().connections.push({
    id: "connection-" + Date.now(),
    cardAId: pendingConnectionCardId,
    cardBId: cardId,
    color: "blue"
  });

  pendingConnectionCardId = null;
  saveAppState();
  renderConnections();
  setActiveTool("select");
}

function renderConnections() {
  const svg = document.getElementById("connections-svg");
  if (!svg) { return; }
  svg.innerHTML = "";

  getActiveBoard().connections.forEach(function(connection) {
    const cardA = document.getElementById(connection.cardAId);
    const cardB = document.getElementById(connection.cardBId);
    if (!cardA || !cardB) { return; }

    const x1 = cardA.offsetLeft + cardA.offsetWidth / 2;
    const y1 = cardA.offsetTop + cardA.offsetHeight / 2;
    const x2 = cardB.offsetLeft + cardB.offsetWidth / 2;
    const y2 = cardB.offsetTop + cardB.offsetHeight / 2;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", connection.color || "blue");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  });
}