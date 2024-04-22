// Get elements from the DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const startOverlay = document.getElementById("startOverlay");
const restartButton = document.getElementById("restartButton");
const finalScore = document.getElementById("finalScore");
const gameOverOverlay = document.getElementById("gameOverOverlay");

let birdUp = new Image();
let birdDown = new Image();
birdUp.src = "fly-up.png";
birdDown.src = "fly-down.png";

let imagesLoaded = 0;
function imageLoaded() {
  imagesLoaded++;
}

birdUp.onload = imageLoaded;
birdDown.onload = imageLoaded;

const colors = {
  darkGreen: "#0f380f", // Very dark green for deep shadows
  mediumDarkGreen: "#1e4723", // Dark green for standard outlines and deeper shadows
  mediumGreen: "#306230", // Medium green for body shadows
  lightGreen: "#8bac0f", // Primary body color
  lightestGreen: "#9bbc0f", // Light highlights
  extraLightGreen: "#c2d784", // Extra light for top highlights
};

const terrain = {
  blockHeight: 20, // Height of each terrain block
  blockWidth: 40, // Width of each terrain block
  colors: {
    base: "#0f380f", // Dark green, primary terrain color
    highlight: "#306230", // Lighter green for highlights
    shadow: "#0c2e0c", // Darker green for shadows
  },
  blocks: [], // Array to store the terrain blocks' positions
  speed: 1, // Speed at which the terrain scrolls
};

const mountains = {
  colors: ["#0f380f", "#306230"], // Two shades of green for contrast
  maxPeakHeight: 220, // Maximum height of a mountain peak
  minPeakHeight: 50, // Minimum height of a mountain peak
  numPeaks: 36, // Total number of peaks to generate
  peakWidth: 160, // Width of the base of each peak
  speed: 0.5,
};

// Game state variables
let gameStarted = false;
let animationId = null;
let score = 0;
let frames = 0;
let pipes = [];
let nextPipeFrame = 300;
let bird = {
  x: () => canvas.width / 2 - 10,
  y: canvas.height / 2 - 10,
  width: 80,
  height: 80,
  hitboxWidth: 36,
  hitboxHeight: 36,
  gravity: 0.16,
  lift: -8,
  velocity: 0,
};
let birdHealth = {
  maxHealth: 100,
  currentHealth: 100,
  width: 100, // Width of the health bar in pixels
  height: 10, // Height of the health bar
};
let hitAnimation = {
  active: false,
  duration: 300, // frames the animation will last
  currentFrame: 0,
};

// Event Listeners
window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && gameStarted) {
    bird.velocity = bird.lift;
  }
});
canvas.addEventListener("mousedown", function (e) {
  if (gameStarted) {
    bird.velocity = bird.lift;
  }
});
canvas.addEventListener("touchstart", function (e) {
  if (gameStarted) {
    e.preventDefault();
    bird.velocity = bird.lift;
  }
});

// Initialize and resize canvas
function resizeCanvas() {
  const maxWidth = 640; // Max width for larger displays
  const maxHeight = 960; // Max height for larger displays
  const scaleFactor = Math.min(
    window.innerWidth / 320,
    window.innerHeight / 480
  );
  canvas.width = Math.min(320 * scaleFactor, maxWidth);
  canvas.height = Math.min(480 * scaleFactor, maxHeight);

  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}
resizeCanvas(); // Initial resize on load

// Game functions
function startGame() {
  if (imagesLoaded === 2) {
    initializeTerrain();
    initializeMountains();
    gameStarted = true;
    startOverlay.style.display = "none";
    resetGame();
    gameLoop();
    bird.velocity = bird.lift;
  } else {
    console.error("Images not fully loaded");
  }
}

function restartGame() {
  document.getElementById("gameOverOverlay").style.display = "none";
  resetGame();
  startGame();
}

function resetGame() {
  birdHealth.currentHealth = 100;
  bird.y = canvas.height / 2 - bird.height / 2;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frames = 0;
  nextPipeFrame = 300;
}

function gameLoop() {
  if (!gameStarted) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawTerrain();
  updateTerrain();

  drawMountains(); // Draw the mountains each frame
  updateMountains(); // Update the position of the mountains for scrolling effect

  drawBird();
  updateBird();
  handlePipes();
  drawPipes();
  updateScore();
  drawScore();
  drawHealthBar();
  checkCollision();
  frames++;
  animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  console.log("Game Over!");
  gameStarted = false; // Stop the game
  finalScore.innerText = "Score: " + score;
  gameOverOverlay.style.display = "flex";
  window.cancelAnimationFrame(animationId);
}

function startHitAnimation() {
  if (!hitAnimation.active) {
    hitAnimation.active = true;
    hitAnimation.currentFrame = 0;
    setTimeout(() => {
      hitAnimation.active = false;
      console.log("Ending hit animation.");
    }, 3000); // Continues to flash for 3 second
  }
}

function initializeTerrain() {
  const numBlocks = Math.ceil(canvas.width / terrain.blockWidth) + 1; // Number of blocks to fill the canvas width
  terrain.blocks = [];
  for (let i = 0; i < numBlocks; i++) {
    terrain.blocks.push({
      x: i * terrain.blockWidth,
      y: canvas.height - terrain.blockHeight, // Draw at the bottom of the canvas
    });
  }
}

function updateMountains() {
  mountains.peaks.forEach((peak) => {
    peak.x -= mountains.speed; // Scroll each peak to the left
  });

  // When the first mountain moves fully off-screen, regenerate it at the end
  if (mountains.peaks[0].x + mountains.peakWidth < 0) {
    const lastPeak = mountains.peaks[mountains.peaks.length - 1];
    const newHeight =
      Math.random() * (mountains.maxPeakHeight - mountains.minPeakHeight) +
      mountains.minPeakHeight;
    const newColor =
      mountains.colors[Math.floor(Math.random() * mountains.colors.length)]; // Random new color for variation
    mountains.peaks.push({
      x: lastPeak.x + mountains.peakWidth,
      height: newHeight,
      color: newColor,
    });
    mountains.peaks.shift();
  }
}

function drawMountains() {
  mountains.peaks.forEach((peak) => {
    ctx.beginPath();
    ctx.moveTo(peak.x, canvas.height);
    ctx.lineTo(
      peak.x + mountains.peakWidth / 2,
      canvas.height - peak.height + 20
    );
    ctx.lineTo(peak.x + mountains.peakWidth, canvas.height);
    ctx.closePath();
    ctx.fillStyle = peak.color; // Use the color assigned to this peak
    ctx.fill();
  });
}

function initializeMountains() {
  mountains.peaks = [];
  let currentX = canvas.width; // Start drawing from just beyond the right edge of the canvas

  for (let i = 0; i < mountains.numPeaks; i++) {
    const height =
      Math.random() * (mountains.maxPeakHeight - mountains.minPeakHeight) +
      mountains.minPeakHeight;
    const color = mountains.colors[i % mountains.colors.length]; // Assign color persistently
    mountains.peaks.push({
      x: currentX,
      height: height,
      color: color, // Store color as a property of the peak
    });
    currentX += mountains.peakWidth;
  }
}

function updateTerrain() {
  // Move each block left by the speed
  terrain.blocks.forEach((block) => (block.x -= terrain.speed));

  // Check if the first block has moved off screen
  if (terrain.blocks[0].x < -terrain.blockWidth) {
    // Remove the first block and add a new one at the end to keep the length constant
    terrain.blocks.shift();
    const lastBlock = terrain.blocks[terrain.blocks.length - 1];
    terrain.blocks.push({
      x: lastBlock.x + terrain.blockWidth,
      y: canvas.height - terrain.blockHeight,
    });
  }
}

function drawTerrain() {
  terrain.blocks.forEach((block) => {
    ctx.fillStyle = terrain.colors.base;
    ctx.fillRect(block.x, block.y, terrain.blockWidth, terrain.blockHeight);

    // Add highlight
    ctx.fillStyle = terrain.colors.highlight;
    ctx.fillRect(block.x, block.y, terrain.blockWidth, 3); // Top highlight

    // Add shadow
    ctx.fillStyle = terrain.colors.shadow;
    ctx.fillRect(
      block.x,
      block.y + terrain.blockHeight - 3,
      terrain.blockWidth,
      3
    ); // Bottom shadow
  });
}

function drawBird() {
  ctx.save(); // Save the current state of the canvas

  // Move the canvas origin to the bird's position for rotation
  ctx.translate(bird.x(), bird.y);

  // Rotate the canvas based on the bird's velocity
  let angle = bird.velocity * 0.06; // Adjust rotation factor to taste, 0.08 as an example
  ctx.rotate(angle);

  // Handle flashing effect when hit
  if (hitAnimation.active) {
    hitAnimation.currentFrame++;
    ctx.globalAlpha = hitAnimation.currentFrame % 6 < 3 ? 0.2 : 0.8;
    if (hitAnimation.currentFrame >= hitAnimation.duration) {
      hitAnimation.active = false;
      ctx.globalAlpha = 1; // Ensure alpha is reset after animation
    }
  } else {
    ctx.globalAlpha = 1;
  }

  // Determine which bird image to use based on the current velocity
  let birdImage = bird.velocity < 0 ? birdUp : birdDown;

  // Draw the bird image centered on the translated and rotated origin
  ctx.drawImage(
    birdImage,
    -bird.width / 2,
    -bird.height / 2,
    bird.width,
    bird.height
  );

  ctx.restore(); // Restore the canvas state to prevent unwanted transformations elsewhere in the drawing code

  // Optionally, you can re-enable and adjust the debug hitbox drawing to align with the rotated bird
  // if you wish to visually debug the hitbox alignment:
  // ctx.strokeStyle = "red";
  // ctx.strokeRect(bird.x() - bird.hitboxWidth / 2, bird.y - bird.hitboxHeight / 2, bird.hitboxWidth, bird.hitboxHeight);
}

function drawHealthBar() {
  const margin = 10; // Margin on each side of the health bar
  const healthBarHeight = 20; // Height of the health bar
  const healthBarY = 10; // Y position of the health bar
  const healthBarWidth = canvas.width - 2 * margin; // Width of the health bar minus margins on both sides

  // Draw background of the health bar
  ctx.fillStyle = "#0f380f"; // Dark green, retro Game Boy background
  ctx.fillRect(margin, healthBarY, healthBarWidth, healthBarHeight);

  // Draw the current health
  const healthPercentage = birdHealth.currentHealth / birdHealth.maxHealth;
  ctx.fillStyle = "#8bac0f"; // Light green, Game Boy foreground
  ctx.fillRect(
    margin,
    healthBarY,
    healthBarWidth * healthPercentage,
    healthBarHeight
  );

  // Optional: Add a border to the health bar
  ctx.strokeStyle = "#306230"; // Medium green for border
  ctx.strokeRect(margin, healthBarY, healthBarWidth, healthBarHeight);
}

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
}

function handlePipes() {
  if (frames >= nextPipeFrame) {
    createPipe();
  }
  updatePipes();
}

function createPipe() {
  let randomGap = 300 + Math.floor(Math.random() * 150);
  let randomPipeWidth = 40 + Math.floor(Math.random() * 40);
  let pipeHeight =
    Math.floor(Math.random() * (canvas.height - randomGap - 20)) + 10;
  pipes.push({
    x: canvas.width,
    y: pipeHeight,
    gap: randomGap,
    width: randomPipeWidth,
  });
  nextPipeFrame = frames + 300 + Math.floor(Math.random() * 200);
}

function updatePipes() {
  pipes.forEach((pipe) => {
    pipe.x -= 1;
    if (pipe.x + pipe.width < 0) {
      pipes.splice(pipes.indexOf(pipe), 1);
    }
  });
}

function drawPipes() {
  pipes.forEach((pipe) => {
    const x = pipe.x;
    const y = pipe.y;
    const width = pipe.width;
    const height = pipe.y; // Height of the upper pipe
    const lowerY = y + pipe.gap;
    const lowerHeight = canvas.height - lowerY; // Height of the lower pipe

    // Main body
    ctx.fillStyle = colors.lightGreen;
    ctx.fillRect(x, 0, width, height);
    ctx.fillRect(x, lowerY, width, lowerHeight);

    // Dark outline
    ctx.strokeStyle = colors.mediumDarkGreen;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, width, height);
    ctx.strokeRect(x, lowerY, width, lowerHeight);

    // Inner shadow
    ctx.fillStyle = colors.mediumGreen;
    ctx.fillRect(x + 2, 0, 4, height);
    ctx.fillRect(x + 2, lowerY, 4, lowerHeight);

    // Right side shadow
    ctx.fillStyle = colors.darkGreen;
    ctx.fillRect(x + width - 6, 0, 6, height);
    ctx.fillRect(x + width - 6, lowerY, 6, lowerHeight);

    // Top and bottom highlights
    ctx.fillStyle = colors.lightestGreen;
    ctx.fillRect(x, y - 2, width, 2);
    ctx.fillRect(x, y + pipe.gap, width, 2);

    // Extra highlight on the left edge
    ctx.fillStyle = colors.extraLightGreen;
    ctx.fillRect(x, 0, 2, height);
    ctx.fillRect(x, lowerY, 2, lowerHeight);
  });
}

function updateScore() {
  pipes.forEach((pipe) => {
    if (!pipe.scored && pipe.x + pipe.width < bird.x()) {
      score++;
      pipe.scored = true;
    }
  });
}

function drawScore() {
  const scoreY = 60; // Position the score just below the health bar
  ctx.fillStyle = "#0f380f"; // Lightest green for text
  ctx.font = '16px "Press Start 2P"'; // Retro styled font
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, scoreY);
}

function checkCollision() {
  // Check collision with the hitbox centered within the full sprite dimensions
  let birdHitboxX = bird.x() - bird.hitboxWidth / 2;
  let birdHitboxY = bird.y - bird.hitboxHeight / 2;

  pipes.forEach((pipe) => {
    if (
      birdHitboxX < pipe.x + pipe.width &&
      birdHitboxX + bird.hitboxWidth > pipe.x &&
      (birdHitboxY < pipe.y ||
        birdHitboxY + bird.hitboxHeight > pipe.y + pipe.gap) &&
      !hitAnimation.active
    ) {
      birdHealth.currentHealth -= 20;
      if (birdHealth.currentHealth > 0) {
        startHitAnimation();
      } else {
        gameOver();
      }
    }
  });

  // Ground collision with hitbox
  if (birdHitboxY + bird.hitboxHeight >= canvas.height || birdHitboxY <= 0) {
    gameOver();
  }
}
