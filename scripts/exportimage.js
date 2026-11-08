/* global ranking */

var EXPORT_WIDTH = 1600;
var EXPORT_HEIGHT = 2000;
var EXPORT_FRAME_SRC = "assets/export/export_frame.jpg";
var EXPORT_PORTRAIT_DIR = "assets/export/portraits/";

function saveBig4Image() {
  var kapamilya = ranking.slice(0, 4);
  var kapuso = ranking.slice(4, 8);
  var selectedCount =
    kapamilya.filter(function (h) { return h && h.id >= 0; }).length +
    kapuso.filter(function (h) { return h && h.id >= 0; }).length;

  if (selectedCount === 0) {
    alert("Pick at least one Kapamilya or Kapuso housemate before saving an image.");
    return;
  }

  var ok = window.confirm(
    "Save your Kapamilya Big 4 and Kapuso Big 4 image to Photos/Gallery?"
  );
  if (!ok) return;

  var btn = document.getElementById("saveimage-button");
  if (btn) {
    btn.disabled = true;
    btn.value = "Saving...";
  }

  generateBig4ExportImage(kapamilya, kapuso)
    .then(function (blob) {
      var filename =
        "PBB-Collab3-Big4-" +
        new Date().toISOString().slice(0, 10) +
        ".png";
      downloadImageBlob(blob, filename);
    })
    .catch(function (err) {
      console.error(err);
      alert("Could not create the image. Please try again.");
    })
    .finally(function () {
      if (btn) {
        btn.disabled = false;
        btn.value = "Save Big 4 Image";
      }
    });
}

function downloadImageBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 2000);
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(img);
    };
    img.onerror = function () {
      reject(new Error("Failed to load " + src));
    };
    img.src = src;
  });
}

function loadImageOptional(src) {
  return loadImage(src).catch(function () {
    return null;
  });
}

async function ensureExportFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('800 64px "Archivo Black"'),
      document.fonts.load('800 36px "Archivo Black"'),
      document.fonts.load('700 28px "Outfit"'),
    ]);
  } catch (err) {
    // Fall back to system fonts if webfont load fails.
  }
}

async function generateBig4ExportImage(kapamilya, kapuso) {
  await ensureExportFonts();

  var canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  var ctx = canvas.getContext("2d");

  var frame = await loadImage(EXPORT_FRAME_SRC);
  ctx.drawImage(frame, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  // Soft cream wash so titles/cards stay readable over busy corners.
  ctx.fillStyle = "rgba(246, 240, 224, 0.18)";
  ctx.fillRect(120, 120, EXPORT_WIDTH - 240, EXPORT_HEIGHT - 240);

  var portraitNames = [];
  [kapamilya, kapuso].forEach(function (group) {
    group.forEach(function (hm) {
      if (hm && hm.id >= 0 && hm.shortname) {
        portraitNames.push(String(hm.shortname).toLowerCase());
      }
    });
  });

  var portraitMap = {};
  await Promise.all(
    portraitNames.map(async function (name) {
      var img = await loadImageOptional(EXPORT_PORTRAIT_DIR + name + ".jpg");
      if (!img && ranking) {
        // Fallback to circular list assets if promo crop is missing.
        img = await loadImageOptional("assets/housemates/" + name + ".png");
      }
      portraitMap[name] = img;
    })
  );

  drawSectionTitle(ctx, "KAPAMILYA BIG 4", EXPORT_WIDTH / 2, 210, "#c8102e");
  await drawCardRow(ctx, kapamilya, 320, "#c8102e", portraitMap);

  drawSectionTitle(ctx, "KAPUSO BIG 4", EXPORT_WIDTH / 2, 1120, "#0057b8");
  await drawCardRow(ctx, kapuso, 1230, "#0057b8", portraitMap);

  // Footer credit
  ctx.save();
  ctx.fillStyle = "rgba(42, 31, 22, 0.7)";
  ctx.font = '700 22px "Outfit", "Arial", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("PBB COLLAB 3.0  •  MY BIG 4", EXPORT_WIDTH / 2, EXPORT_HEIGHT - 90);
  ctx.restore();

  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

function drawSectionTitle(ctx, text, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-3 * Math.PI) / 180);

  var font = '800 70px "Archivo Black", "Arial Black", "Impact", sans-serif';
  ctx.font = font;
  var metrics = ctx.measureText(text);
  var padX = 36;
  var padY = 18;
  var w = metrics.width + padX * 2;
  var h = 92;

  // White tilted banner
  ctx.fillStyle = "#fffdf8";
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

async function drawCardRow(ctx, housemates, top, accent, portraitMap) {
  var count = 4;
  var gap = 28;
  var cardW = 300;
  var cardH = 420;
  var totalW = count * cardW + (count - 1) * gap;
  var startX = (EXPORT_WIDTH - totalW) / 2;

  for (var i = 0; i < count; i++) {
    var hm = housemates[i];
    var x = startX + i * (cardW + gap);
    var portrait = null;
    var label = "";
    if (hm && hm.id >= 0) {
      label = String(hm.shortname || "").toUpperCase();
      portrait = portraitMap[String(hm.shortname || "").toLowerCase()] || null;
    }
    drawHousemateCard(ctx, x, top, cardW, cardH, accent, portrait, label, i + 1);
  }
}

function drawHousemateCard(ctx, x, y, w, h, accent, portrait, label, rank) {
  ctx.save();

  // Outer shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;

  // Black photo plate with colored border
  ctx.fillStyle = "#111111";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";

  // Inner white stroke
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  roundRect(ctx, x + 12, y + 12, w - 24, h - 24, 4);
  ctx.stroke();

  // Portrait area
  var photoX = x + 18;
  var photoY = y + 18;
  var photoW = w - 36;
  var photoH = h - 110;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, photoX, photoY, photoW, photoH, 2);
  ctx.clip();
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(photoX, photoY, photoW, photoH);

  if (portrait) {
    drawImageCover(ctx, portrait, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = '700 42px "Outfit", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(rank), photoX + photoW / 2, photoY + photoH / 2);
  }
  ctx.restore();

  // Rank chip
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 34, y + 34, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 20px "Archivo Black", "Arial Black", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(rank), x + 34, y + 35);

  // Corner motif (top-left + bottom-right)
  drawCornerMotif(ctx, x + 8, y + 8, 54, accent, false);
  drawCornerMotif(ctx, x + w - 8, y + h - 8, 54, accent, true);

  // Name plate
  var plateH = 58;
  var plateY = y + h - plateH - 18;
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(x + 22, plateY, w - 44, plateH);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 22, plateY, w - 44, plateH);

  ctx.fillStyle = accent;
  ctx.font = '800 28px "Archivo Black", "Arial Black", "Impact", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  var name = label || "—";
  fitCenteredText(ctx, name, x + w / 2, plateY + plateH / 2 + 1, w - 60, 28);

  ctx.restore();
}

function drawCornerMotif(ctx, anchorX, anchorY, size, accent, flip) {
  ctx.save();
  ctx.translate(anchorX, anchorY);
  if (flip) ctx.rotate(Math.PI);

  // Triangular woven corner
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(size - 14, 4);
  ctx.lineTo(4, size - 14);
  ctx.closePath();
  ctx.fillStyle = "#f5c518";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(28, 10);
  ctx.lineTo(19, 19);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.fillRect(12, 12, 6, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(20, 12, 6, 6);
  ctx.fillStyle = "#f5c518";
  ctx.fillRect(12, 20, 6, 6);

  ctx.restore();
}

function drawImageCover(ctx, img, x, y, w, h) {
  var ir = img.width / img.height;
  var tr = w / h;
  var dw;
  var dh;
  var dx;
  var dy;
  if (ir > tr) {
    dh = h;
    dw = h * ir;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    dw = w;
    dh = w / ir;
    dx = x;
    dy = y - (dh - h) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitCenteredText(ctx, text, x, y, maxWidth, baseSize) {
  var size = baseSize;
  ctx.font = '800 ' + size + 'px "Archivo Black", "Arial Black", "Impact", sans-serif';
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = '800 ' + size + 'px "Archivo Black", "Arial Black", "Impact", sans-serif';
  }
  ctx.fillText(text, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  var radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
