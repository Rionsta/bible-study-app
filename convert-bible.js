const fs = require("fs");

const rawText = fs.readFileSync("bsb-raw.txt", "utf8");
const lines = rawText.split("\n");

const bibleData = {};

lines.forEach(function(line) {
  const cleanLine = line.trim();
  if (!cleanLine) {
    return;
  }

  const parts = cleanLine.split("\t");
  const reference = parts[0];
  const text = parts[1];

  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) {
    return;
  }

  const book = match[1];
  const chapter = match[2];
  const verse = match[3];

  if (!bibleData[book]) {
    bibleData[book] = {};
  }
  if (!bibleData[book][chapter]) {
    bibleData[book][chapter] = {};
  }

  bibleData[book][chapter][verse] = text;
});

fs.writeFileSync("bible-data.json", JSON.stringify(bibleData));

console.log("Done! Converted the Bible into bible-data.json");