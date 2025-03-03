// Game variables
let app, snake, food, trail = [];
const gridSize = 20, cellSize = 20;
let direction = { x: 1, y: 0 }, nextDirection = { x: 1, y: 0 };
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let gameState = 'playing';
const snakeColor = localStorage.getItem('selectedColor') || 'green';
const difficulty = localStorage.getItem('difficulty') || 'medium';
const snakeColors = { green: 0x00ff00, red: 0xff0000, blue: 0x0000ff };
const moveIntervals = { easy: 150, medium: 100, hard: 75 };

// Pixi.js setup
app = new PIXI.Application({
    width: gridSize * cellSize,
    height: gridSize * cellSize,
    backgroundColor: 0x000000,
    view: document.getElementById('game-canvas')
});
document.getElementById('game-container').appendChild(app.view);

// Draw grid background
const gridGraphics = new PIXI.Graphics();
gridGraphics.lineStyle(1, 0x333333);
for (let i = 0; i <= gridSize; i++) {
    gridGraphics.moveTo(i * cellSize, 0);
    gridGraphics.lineTo(i * cellSize, gridSize * cellSize);
    gridGraphics.moveTo(0, i * cellSize);
    gridGraphics.lineTo(gridSize * cellSize, i * cellSize);
}
app.stage.addChild(gridGraphics);

// Snake and food
snake = { segments: [{ x: 10, y: 10 }], graphics: new PIXI.Graphics() };
app.stage.addChild(snake.graphics);
food = new PIXI.Graphics();
app.stage.addChild(food);
spawnFood();

// UI updates
function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('high-score').textContent = `High Score: ${highScore}`;
    document.getElementById('coins').textContent = `Coins: ${coins}`;
}
updateUI();

// Game loop
let lastTime = 0;
app.ticker.add((delta) => {
    if (gameState !== 'playing') return;
    const currentTime = performance.now();
    if (currentTime - lastTime >= moveIntervals[difficulty]) {
        moveSnake();
        drawSnake();
        drawFood();
        drawTrail();
        updateUI();
        lastTime = currentTime;
    }
});

// Movement logic
function moveSnake() {
    direction = { ...nextDirection };
    let head = { x: snake.segments[0].x + direction.x, y: snake.segments[0].y + direction.y };

    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize ||
        snake.segments.some(seg => seg.x === head.x && seg.y === head.y)) {
        endGame();
        return;
    }

    snake.segments.unshift(head);
    trail.push({ x: head.x, y: head.y, alpha: 1 });
    if (trail.length > 10) trail.shift();

    if (head.x === food.gridX && head.y === food.gridY) {
        score += 10;
        coins += 1;
        localStorage.setItem('coins', coins);
        spawnFood();
    } else {
        snake.segments.pop();
    }
}

// Drawing functions
function drawSnake() {
    snake.graphics.clear();
    snake.graphics.beginFill(snakeColors[snakeColor]);
    snake.segments.forEach(seg => {
        snake.graphics.drawRoundedRect(seg.x * cellSize, seg.y * cellSize, cellSize - 2, cellSize - 2, 5);
    });
    snake.graphics.endFill();
}

function drawFood() {
    food.clear();
    food.beginFill(0xff0000);
    food.drawCircle(food.gridX * cellSize + cellSize / 2, food.gridY * cellSize + cellSize / 2, cellSize / 2 - 1);
    food.endFill();
}

function drawTrail() {
    trail.forEach((t, i) => {
        const alpha = t.alpha - 0.1 * (i + 1);
        if (alpha > 0) {
            const trailGraphics = new PIXI.Graphics();
            trailGraphics.beginFill(snakeColors[snakeColor], alpha);
            trailGraphics.drawRoundedRect(t.x * cellSize, t.y * cellSize, cellSize - 2, cellSize - 2, 5);
            trailGraphics.endFill();
            app.stage.addChild(trailGraphics);
            setTimeout(() => app.stage.removeChild(trailGraphics), 100);
        }
    });
}

function spawnFood() {
    do {
        food.gridX = Math.floor(Math.random() * gridSize);
        food.gridY = Math.floor(Math.random() * gridSize);
    } while (snake.segments.some(seg => seg.x === food.gridX && seg.y === food.gridY));
}

// Game over
function endGame() {
    gameState = 'gameover';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'block';
    document.getElementById('final-score').textContent = score;
    document.getElementById('high-score-display').textContent = highScore;
}

// Input handling
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp': if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
    }
});

// Restart and menu navigation
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    resetGame();
});

document.getElementById('menu-button').addEventListener('click', () => window.location.href = 'index1.html');

function resetGame() {
    snake.segments = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    trail = [];
    gameState = 'playing';
    spawnFood();
    updateUI();
}