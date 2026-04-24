// ============================================================
// ASCII PHOTOBOOTH (FINAL VERSION)
// ------------------------------------------------------------
// This project creates a photobooth that captures images using
// a multicolour ASCII filter instead of a normal camera feed.
//
// Key improvements made during development:
// I reduced the spacing between characters by lowering the
// scaleFactor so that the image appears denser and clearer.
// I expanded the character set to create smoother gradients
// and better detail in the face.
// I adjusted text alignment and positioning to remove gaps
// between rows of characters.
// I also increased contrast using gamma correction so that
// facial features are more visible in the ASCII output.
// ============================================================

let video;         // webcam input
let asciiLayer;    // offscreen layer used to draw ASCII output

// ASCII settings
// scaleFactor controls spacing between characters.
// A smaller value produces a denser image with more detail.
let scaleFactor = 8;

// Characters are ordered from light to dark.
// This allows brightness to be mapped visually.
let chars = " .'`^\",:;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

// State system controls the flow of the photobooth
// idle → countdown → capture → done
let state = "idle";
let countdown = 3;
let lastTick = 0;

// Stores captured images
let shots = [];
let maxShots = 3;

// Stores final combined photostrip
let finalStrip;


// ============================================================
// SETUP
// This runs once when the program starts.
// ============================================================
function setup() {
  let canvas = createCanvas(600, 450);
  canvas.parent("canvas-holder");

  // Webcam setup
  // The resolution is reduced according to scaleFactor so that
  // each pixel maps cleanly to one ASCII character.
  video = createCapture(VIDEO);
  video.size(width / scaleFactor, height / scaleFactor);
  video.hide();

  // Create an offscreen graphics layer
  // This allows us to render ASCII separately and capture it cleanly.
  asciiLayer = createGraphics(width, height);

  // Connect UI buttons to functions
  document.getElementById("startBtn").onclick = () => {
    startBooth();
  };

  document.getElementById("pickupBtn").onclick = () => {
    downloadStrip();
  };
}


// ============================================================
// DRAW LOOP
// Continuously updates the canvas.
// ============================================================
function draw() {
  background(255);

  // Render ASCII version of webcam
  drawASCII();

  // Display ASCII layer
  image(asciiLayer, 0, 0);

  // Show countdown overlay if active
  if (state === "countdown") {
    drawCountdown();
  }
}


// ============================================================
// ASCII FILTER
// Converts webcam pixels into ASCII characters.
// ============================================================
function drawASCII() {
  video.loadPixels();
  asciiLayer.clear();

  asciiLayer.textSize(scaleFactor);
  asciiLayer.textFont("monospace");

  // I added this alignment to ensure characters are placed
  // consistently and do not create uneven spacing.
  asciiLayer.textAlign(LEFT, TOP);

  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {

      let i = (x + y * video.width) * 4;

      let r = video.pixels[i];
      let g = video.pixels[i + 1];
      let b = video.pixels[i + 2];

      // Convert colour to brightness
      let bright = (r + g + b) / 3;

      // I applied gamma correction here to increase contrast.
      // This makes the ASCII output less flat and improves clarity.
      bright = pow(bright / 255, 0.5) * 255;

      // Map brightness to character
      let index = floor(map(bright, 0, 255, 0, chars.length));
      let c = chars.charAt(index);

      // Use original pixel colour with slight enhancement
      // This change improves visibility compared to a single-colour filter.
      asciiLayer.fill(
        constrain(r * 1.3, 0, 255),
        constrain(g * 1.3, 0, 255),
        constrain(b * 1.3, 0, 255)
      );

      // I slightly adjusted the vertical position to reduce visible gaps
      // between rows of characters.
      asciiLayer.text(c, x * scaleFactor, y * scaleFactor - 2);
    }
  }
}


// ============================================================
// START PHOTOBOOTH
// Resets state and begins capture sequence.
// ============================================================
function startBooth() {
  shots = [];
  clearSidebar();

  document.getElementById("counter").innerText = "0/3";
  document.getElementById("instruction").innerText = "Get ready...";

  nextShot();
}


// ============================================================
// PREPARE NEXT SHOT
// ============================================================
function nextShot() {
  countdown = 3;
  state = "countdown";
  lastTick = millis();
}


// ============================================================
// COUNTDOWN DISPLAY
// Shows timer before capturing each photo.
// ============================================================
function drawCountdown() {
  fill(255, 150);
  rect(0, 0, width, height);

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(80);
  text(countdown, width / 2, height / 2);

  if (millis() - lastTick > 1000) {
    countdown--;
    lastTick = millis();

    if (countdown === 1) {
      document.getElementById("instruction").innerText = "Look at the camera!";
    }

    if (countdown === 0) {
      captureShot();
    }
  }
}


// ============================================================
// CAPTURE PHOTO
// Saves the ASCII-rendered frame.
// ============================================================
function captureShot() {
  let img = asciiLayer.get();
  shots.push(img);

  addPreview(img);

  document.getElementById("counter").innerText = shots.length + "/3";

  if (shots.length < maxShots) {
    setTimeout(nextShot, 500);
  } else {
    finishBooth();
  }
}


// ============================================================
// SIDEBAR PREVIEW
// Displays captured images on the side.
// ============================================================
function addPreview(img) {
  let el = createImg(img.canvas.toDataURL());
  el.class("preview");
  el.parent("sidebar");
}

function clearSidebar() {
  document.getElementById("sidebar").innerHTML = "";
}


// ============================================================
// FINISH PROCESS
// ============================================================
function finishBooth() {
  document.getElementById("instruction").innerText = "Photos ready below!";
  createStrip();
  state = "done";
}


// ============================================================
// CREATE PHOTOSTRIP
// Combines images into one vertical strip.
// ============================================================
function createStrip() {
  finalStrip = createGraphics(250, shots.length * 180);
  finalStrip.background(255);

  for (let i = 0; i < shots.length; i++) {
    finalStrip.image(shots[i], 0, i * 180, 250, 180);
  }
}


// ============================================================
// DOWNLOAD FUNCTION
// Allows user to save the final image.
// ============================================================
function downloadStrip() {
  if (finalStrip) {
    save(finalStrip, "photobooth.png");
  }
}