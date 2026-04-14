document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".button");
  buttons.forEach((button) => {
    button.addEventListener("mouseover", () => {
      button.style.filter = "brightness(1.05)";
    });
    button.addEventListener("mouseout", () => {
      button.style.filter = "none";
    });
  });

  const brandDot = document.querySelector(".brand-dot");
  if (!brandDot) return;

  const overlay = createGameOverlay();
  document.body.appendChild(overlay.container);

  brandDot.addEventListener("click", () => {
    overlay.open();
  });
});

function createGameOverlay() {
  const container = document.createElement("div");
  container.className = "game-overlay";
  container.innerHTML = `
    <div class="game-panel">
      <div class="game-header">
        <h2>Brick Breaker</h2>
        <button class="game-close" type="button">Close</button>
      </div>
      <div class="game-canvas-wrap">
        <canvas id="game-canvas" width="760" height="420"></canvas>
      </div>
      <div class="game-info">
        <span>Use left/right arrows or mouse to move the paddle.</span>
        <span class="game-message">Press space to launch</span>
      </div>
    </div>
  `;

  const closeButton = container.querySelector(".game-close");
  const canvas = container.querySelector("#game-canvas");
  const message = container.querySelector(".game-message");
  const context = canvas.getContext("2d");

  const settings = {
    paddleWidth: 110,
    paddleHeight: 12,
    ballRadius: 8,
    rowCount: 4,
    colCount: 7,
    brickPadding: 10,
    brickOffsetTop: 40,
    brickOffsetLeft: 20,
    brickWidth: 92,
    brickHeight: 20,
  };

  const state = {
    paddleX: (canvas.width - settings.paddleWidth) / 2,
    ballX: canvas.width / 2,
    ballY: canvas.height - 60,
    ballSpeedX: 4,
    ballSpeedY: -4,
    bricks: [],
    isLaunched: false,
    isRunning: false,
    score: 0,
    lives: 3,
    messageText: "Press space to launch",
  };

  const keys = { left: false, right: false };

  initBricks();

  function initBricks() {
    state.bricks = [];
    for (let row = 0; row < settings.rowCount; row += 1) {
      const brickRow = [];
      for (let col = 0; col < settings.colCount; col += 1) {
        brickRow.push({ x: 0, y: 0, status: 1 });
      }
      state.bricks.push(brickRow);
    }
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    drawBall();
    drawScore();
  }

  function drawBricks() {
    for (let row = 0; row < settings.rowCount; row += 1) {
      for (let col = 0; col < settings.colCount; col += 1) {
        const brick = state.bricks[row][col];
        if (brick.status === 1) {
          const x = col * (settings.brickWidth + settings.brickPadding) + settings.brickOffsetLeft;
          const y = row * (settings.brickHeight + settings.brickPadding) + settings.brickOffsetTop;
          brick.x = x;
          brick.y = y;
          context.fillStyle = row % 2 === 0 ? "#dc2626" : "#334155";
          context.fillRect(x, y, settings.brickWidth, settings.brickHeight);
          context.strokeStyle = "#ffffff";
          context.strokeRect(x, y, settings.brickWidth, settings.brickHeight);
        }
      }
    }
  }

  function drawPaddle() {
    context.fillStyle = "#0f172a";
    context.fillRect(state.paddleX, canvas.height - settings.paddleHeight - 20, settings.paddleWidth, settings.paddleHeight);
  }

  function drawBall() {
    context.beginPath();
    context.arc(state.ballX, state.ballY, settings.ballRadius, 0, Math.PI * 2);
    context.fillStyle = "#dc2626";
    context.fill();
    context.closePath();
  }

  function drawScore() {
    context.fillStyle = "#334155";
    context.font = "14px Inter, system-ui, sans-serif";
    context.fillText(`Score: ${state.score}`, 16, 26);
    context.fillText(`Lives: ${state.lives}`, canvas.width - 88, 26);
  }

  function update() {
    if (!state.isRunning) return;

    if (keys.left) {
      state.paddleX -= 7;
    }
    if (keys.right) {
      state.paddleX += 7;
    }
    state.paddleX = Math.max(0, Math.min(canvas.width - settings.paddleWidth, state.paddleX));

    if (state.isLaunched) {
      state.ballX += state.ballSpeedX;
      state.ballY += state.ballSpeedY;
    } else {
      state.ballX = state.paddleX + settings.paddleWidth / 2;
      state.ballY = canvas.height - settings.paddleHeight - 28;
    }

    if (state.ballX + settings.ballRadius > canvas.width || state.ballX - settings.ballRadius < 0) {
      state.ballSpeedX = -state.ballSpeedX;
    }
    if (state.ballY - settings.ballRadius < 0) {
      state.ballSpeedY = -state.ballSpeedY;
    }

    const paddleTop = canvas.height - settings.paddleHeight - 20;
    if (
      state.ballY + settings.ballRadius > paddleTop &&
      state.ballX > state.paddleX &&
      state.ballX < state.paddleX + settings.paddleWidth
    ) {
      state.ballSpeedY = -Math.abs(state.ballSpeedY);
      const deltaX = state.ballX - (state.paddleX + settings.paddleWidth / 2);
      state.ballSpeedX = deltaX * 0.15;
    }

    if (state.ballY + settings.ballRadius > canvas.height) {
      state.lives -= 1;
      state.isLaunched = false;
      state.ballSpeedX = 4;
      state.ballSpeedY = -4;
      state.messageText = state.lives > 0 ? "Press space to relaunch" : "Game over. Press R to restart";
      if (state.lives <= 0) {
        state.isRunning = false;
      }
    }

    brickCollision();
    if (state.score === settings.rowCount * settings.colCount * 10) {
      state.isRunning = false;
      state.messageText = "You win! Press R to play again";
    }

    message.textContent = state.messageText;
    draw();
    if (state.isRunning) {
      requestAnimationFrame(update);
    }
  }

  function brickCollision() {
    for (let row = 0; row < settings.rowCount; row += 1) {
      for (let col = 0; col < settings.colCount; col += 1) {
        const brick = state.bricks[row][col];
        if (brick.status !== 1) continue;
        if (
          state.ballX > brick.x &&
          state.ballX < brick.x + settings.brickWidth &&
          state.ballY > brick.y &&
          state.ballY < brick.y + settings.brickHeight
        ) {
          state.ballSpeedY = -state.ballSpeedY;
          brick.status = 0;
          state.score += 10;
        }
      }
    }
  }

  function resetGame() {
    state.paddleX = (canvas.width - settings.paddleWidth) / 2;
    state.ballX = canvas.width / 2;
    state.ballY = canvas.height - 60;
    state.ballSpeedX = 4;
    state.ballSpeedY = -4;
    state.isLaunched = false;
    state.isRunning = true;
    state.score = 0;
    state.lives = 3;
    state.messageText = "Press space to launch";
    initBricks();
    message.textContent = state.messageText;
    draw();
    requestAnimationFrame(update);
  }

  function openOverlay() {
    container.classList.add("active");
    if (!state.isRunning) {
      resetGame();
    }
    window.addEventListener("keydown", handleKeys);
    canvas.addEventListener("mousemove", handleMouseMove);
  }

  function closeOverlay() {
    container.classList.remove("active");
    state.isRunning = false;
    window.removeEventListener("keydown", handleKeys);
    canvas.removeEventListener("mousemove", handleMouseMove);
  }

  function handleKeys(event) {
    if (event.key === "ArrowLeft") {
      keys.left = true;
    }
    if (event.key === "ArrowRight") {
      keys.right = true;
    }
    if (event.code === "Space" || event.key === " ") {
      if (!state.isLaunched && state.lives > 0) {
        state.isLaunched = true;
        state.isRunning = true;
        state.messageText = "";
        requestAnimationFrame(update);
      }
    }
    if (event.key.toLowerCase() === "r") {
      resetGame();
    }
  }

  function handleKeyUp(event) {
    if (event.code === "ArrowLeft" || event.key === "ArrowLeft") {
      keys.left = false;
    }
    if (event.code === "ArrowRight" || event.key === "ArrowRight") {
      keys.right = false;
    }
  }

  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    state.paddleX = Math.max(0, Math.min(canvas.width - settings.paddleWidth, x - settings.paddleWidth / 2));
  }

  closeButton.addEventListener("click", () => {
    closeOverlay();
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      keys.left = false;
      keys.right = false;
    }
  });

  window.addEventListener("keyup", handleKeyUp);

  draw();

  return {
    container,
    open: openOverlay,
  };
}
