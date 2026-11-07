var housemates = [];
var filteredHousemates = [];
var ranking = [];

document.addEventListener("DOMContentLoaded", async function () {
  ranking = newRanking();
  getRanking();
  await readFromCSV("./housemate_info.csv");
  populateRanking();
});

function newRanking() {
  let list = new Array(8);
  for (let i = 0; i < list.length; i++) {
    list[i] = newHousemate();
  }
  return list;
}

async function readFromCSV(path) {
  const response = await fetch(path);
  if (!response.ok) {
    console.error("Failed to fetch CSV. HTTP Status:", response.status);
    return;
  }
  const allText = await response.text();
  const csvData = CSV.parse(allText);
  convertCSVArrayToHousemateData(csvData);
  populateTable(filteredHousemates);
}

function convertCSVArrayToHousemateData(csvArrays) {
  housemates = csvArrays.map(function (housemateArray) {
    if (!housemateArray || housemateArray.length < 8) {
      return newHousemate();
    }
    const status = (housemateArray[6] || "s").toLowerCase();
    const housemate = {
      fullname: housemateArray[0],
      shortname: housemateArray[1],
      agency: housemateArray[2],
      location: housemateArray[3],
      agencycolor: housemateArray[4],
      agencysm: housemateArray[4] === "A",
      agencysp: housemateArray[4] === "B",
      age: housemateArray[5],
      status: status,
      evicted: status === "e",
      nominated: status === "n",
      immunity: status === "i",
      safe: status === "s" || status === "i",
      big4: status === "b",
      id: parseInt(housemateArray[7], 10) - 1,
      image: housemateArray[1].toLowerCase() + ".png",
      selected: false,
    };
    return housemate;
  });

  // Restore selected flags from ranking
  ranking.forEach((hm) => {
    if (hm && hm.id >= 0) {
      const found = findHousemateById(hm.id);
      if (found.id >= 0) found.selected = true;
    }
  });

  filteredHousemates = housemates.slice();
  if (!activeCompares.includes(evictedAtBottomCompare)) {
    activeCompares.push(evictedAtBottomCompare);
  }
  filteredHousemates = sortedHousemates(filteredHousemates);
  return housemates;
}

function newHousemate() {
  return {
    id: -1,
    fullname: "&#8203;",
    shortname: "&#8203;",
    location: "&#8203;",
    age: "&#8203;",
    agency: "",
    agencycolor: "no",
    image: "emptyrank.png",
    selected: false,
    evicted: false,
    nominated: false,
    immunity: false,
    safe: false,
  };
}

function findHousemateById(id) {
  for (let i = 0; i < housemates.length; i++) {
    if (id === housemates[i].id) return housemates[i];
  }
  return newHousemate();
}

function getRanking() {
  var urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("r")) return;

  let rankString = atob(urlParams.get("r"));
  let rankingIds = [];
  for (let i = 0; i < rankString.length; i += 2) {
    let housemateId = rankString.substr(i, 2);
    if (housemateId === "XX") rankingIds.push(-1);
    else rankingIds.push(parseInt(housemateId, 10));
  }

  for (let i = 0; i < rankingIds.length && i < ranking.length; i++) {
    let housemateId = rankingIds[i];
    if (housemateId < 0) {
      ranking[i] = newHousemate();
    } else {
      let housemate = findHousemateById(housemateId);
      if (housemate.id >= 0) housemate.selected = true;
      ranking[i] = housemate;
    }
  }
}

function rerenderTable() {
  clearTable();
  populateTable(filteredHousemates);
}

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function clearTable() {
  removeAllChildren(document.getElementById("table__entry-container"));
}

function clearRanking() {
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1);
  rankRows.forEach((row) => removeAllChildren(row));
}

function clearRanking2() {
  let ranking_chart2 = document.getElementById("ranking__pyramid2");
  let rankRows2 = Array.from(ranking_chart2.children).slice(1);
  rankRows2.forEach((row) => removeAllChildren(row));
}

function statusLabel(housemate) {
  if (housemate.evicted) return { text: "Evicted", cls: "status-evicted" };
  if (housemate.nominated) return { text: "Nominated", cls: "status-nominated" };
  if (housemate.immunity) return { text: "Immunity", cls: "status-immunity" };
  return { text: "Safe", cls: "status-safe" };
}

function populateTable(list) {
  let table = document.getElementById("table__entry-container");
  for (let i = 0; i < list.length; i++) {
    table.insertAdjacentHTML("beforeend", populateTableEntry(list[i]));
    let insertedEntry = table.lastChild;
    insertedEntry.addEventListener("click", function () {
      tableClicked(list[i]);
    });
  }
}

function populateTableEntry(housemate) {
  let evictedClass = housemate.evicted ? "evicted" : "";
  let nominated = housemate.nominated;
  let immunity = housemate.immunity;
  let status = statusLabel(housemate);

  return `
    <div class="table__entry ${evictedClass}">
      <div class="table__entry-icon">
        <img class="table__entry-img" src="assets/housemates/${housemate.image}" alt="${housemate.shortname}" />
        <div class="table__entry-icon-border ${housemate.agencycolor.toLowerCase()}-rank-border"></div>
        ${nominated ? '<div class="table__entry-nominated"></div>' : ""}
        ${immunity ? '<div class="table__entry-immunity"></div>' : ""}
        ${housemate.selected ? '<img class="table__entry-check" src="assets/check.png" alt="selected"/>' : ""}
      </div>
      <div class="table__entry-text">
        <span class="fullname"><strong>${housemate.fullname}</strong></span>
        <span class="agency">(${housemate.agency})</span>
        <span class="ageandlocation">${housemate.age} • ${housemate.location.toUpperCase()}</span>
        <span class="status-pill ${status.cls}">${status.text}</span>
      </div>
    </div>`;
}

function populateRankingEntry(housemate, displayRank, absoluteIndex) {
  let evictedClass = housemate.evicted ? "evicted" : "";
  let badgeClass = housemate.agencycolor === "A" ? "bg-a" : housemate.agencycolor === "B" ? "bg-b" : "bg-no";
  let nominated = housemate.nominated;
  let immunity = housemate.immunity;

  return `
    <div class="ranking__entry-view ${evictedClass}">
      <div class="ranking__entry-icon">
        <img class="ranking__entry-img" src="assets/housemates/${housemate.image}" alt="${housemate.shortname}" />
        <div class="ranking__entry-icon-border ${housemate.agencycolor.toLowerCase()}-rank-border" data-rankid="${absoluteIndex}"></div>
        ${nominated ? '<div class="ranking__entry-nominated"></div>' : ""}
        ${immunity ? '<div class="ranking__entry-immunity"></div>' : ""}
        <div class="ranking__entry-icon-badge ${badgeClass}">${displayRank}</div>
      </div>
    </div>`;
}

function addHousemateToRank(rankRow, housemate, displayRank, absoluteIndex, clickHandler) {
  rankRow.insertAdjacentHTML("beforeend", populateRankingEntry(housemate, displayRank, absoluteIndex));

  let insertedEntry = rankRow.lastChild;
  let dragIcon = insertedEntry.children[0];
  let iconBorder = dragIcon.children[1];

  if (housemate.id >= 0) {
    insertedEntry.addEventListener("click", function () {
      clickHandler(housemate);
    });
    dragIcon.setAttribute("draggable", true);
    dragIcon.classList.add("drag-cursor");
    dragIcon.addEventListener("dragstart", createDragStartListener(absoluteIndex));
  }

  iconBorder.addEventListener("dragenter", createDragEnterListener());
  iconBorder.addEventListener("dragleave", createDragLeaveListener());
  iconBorder.addEventListener("dragover", createDragOverListener());
  iconBorder.addEventListener("drop", function (event) {
    event.preventDefault();
    removeClass(event.target, draggedOverClass);
    const draggedRank = parseInt(event.dataTransfer.getData(rankIndex), 10);
    const droppedRank = parseInt(event.target.getAttribute("data-rankid"), 10);

    // Only allow swaps within the same team pyramid (0-3 Kapamilya, 4-7 Kapuso)
    const sourceTeam = draggedRank < 4 ? "A" : "B";
    const targetTeam = droppedRank < 4 ? "A" : "B";
    if (sourceTeam !== targetTeam) return;

    swapHousemates(draggedRank, droppedRank);
  });
}

function populateRanking() {
  clearRanking();
  clearRanking2();

  let rankRowsA = Array.from(document.getElementById("ranking__pyramid").children).slice(1);
  let rankRowsB = Array.from(document.getElementById("ranking__pyramid2").children).slice(1);

  for (let i = 0; i < 4; i++) {
    let hm = ranking[i] && ranking[i].id >= 0 ? ranking[i] : newHousemate();
    addHousemateToRank(rankRowsA[i], hm, i + 1, i, rankingClickedA);
  }
  for (let i = 0; i < 4; i++) {
    let hm = ranking[i + 4] && ranking[i + 4].id >= 0 ? ranking[i + 4] : newHousemate();
    addHousemateToRank(rankRowsB[i], hm, i + 1, i + 4, rankingClickedB);
  }
}

function tableClicked(housemate) {
  if (housemate.selected) {
    removeHousemateFromRanking(housemate);
    housemate.selected = false;
  } else {
    const added = addHousemateToRanking(housemate);
    if (!added) return;
    housemate.selected = true;
  }
  rerenderTable();
  populateRanking();
}

function rankingClickedA(housemate) {
  removeFromPyramid(housemate, 0, 4);
}

function rankingClickedB(housemate) {
  removeFromPyramid(housemate, 4, 8);
}

function removeFromPyramid(housemate, start, end) {
  for (let i = start; i < end; i++) {
    if (ranking[i].id === housemate.id) {
      ranking[i] = newHousemate();
      break;
    }
  }
  housemate.selected = false;
  rerenderTable();
  populateRanking();
}

function removeHousemateFromRanking(housemate) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === housemate.id) {
      ranking[i] = newHousemate();
      return;
    }
  }
}

function addHousemateToRanking(housemate) {
  const start = housemate.agencysm ? 0 : 4;
  const end = start + 4;
  for (let i = start; i < end; i++) {
    if (ranking[i].id === -1) {
      ranking[i] = housemate;
      return true;
    }
  }
  alert(
    housemate.agencysm
      ? "Kapamilya Big 4 is already full!"
      : "Kapuso Big 4 is already full!"
  );
  return false;
}

function swapHousemates(fromIndex, toIndex) {
  if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;
  if (fromIndex === toIndex) return;
  let temp = ranking[fromIndex];
  ranking[fromIndex] = ranking[toIndex];
  ranking[toIndex] = temp;
  populateRanking();
}

function generateShareLink() {
  let rankString = "";
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id < 0) {
      rankString += "XX";
    } else {
      rankString += ("0" + ranking[i].id).slice(-2);
    }
  }
  let link = window.location.origin + window.location.pathname + "?r=" + btoa(rankString);
  let textbox = document.getElementById("getlink-textbox");
  let copyBtn = document.getElementById("copylink-button");
  textbox.style.display = "inline-block";
  copyBtn.style.display = "inline-block";
  textbox.value = link;
}

function copyLink() {
  let textbox = document.getElementById("getlink-textbox");
  textbox.select();
  textbox.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textbox.value).then(() => {
    let copyBtn = document.getElementById("copylink-button");
    copyBtn.value = "Copied";
    setTimeout(() => {
      copyBtn.value = "Copy";
    }, 1200);
  });
}
