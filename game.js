// Game variables
let app, snake, food;
const gridSize = 20, cellSize = 20;
let direction = { x: 1, y: 0 }, nextDirection = { x: 1, y: 0 };
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let gameState = 'playing';
const snakeColor = localStorage.getItem('selectedColor') || 'green';
const snakeColors = { green: 0x00ff00, red: 0xff0000, blue: 0x0000ff };

// Pixi.js setup
app = new PIXI.Application({
    width: gridSize * cellSize,
    height: gridSize * cellSize,
    backgroundColor: 0x000000,
    view: document.getElementById('game-canvas')
});
document.getElementById('game-container').appendChild(app.view);

// Snake setup
snake = { segments: [{ x: 10, y: 10 }], graphics: new PIXI.Graphics() };
app.stage.addChild(snake.graphics);

// Food setup
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
const moveInterval = 100; // Snake moves every 100ms
app.ticker.add((delta) => {
    if (gameState !== 'playing') return;
    const currentTime = performance.now();
    if (currentTime - lastTime >= moveInterval) {
        moveSnake();
        drawSnake();
        drawFood();
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
        snake.graphics.drawRect(seg.x * cellSize, seg.y * cellSize, cellSize - 2, cellSize - 2);
    });
    snake.graphics.endFill();
}

function drawFood() {
    food.clear();
    food.beginFill(0xff0000);
    food.drawRect(food.gridX * cellSize, food.gridY * cellSize, cellSize - 2, cellSize - 2);
    food.endFill();
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

// Restart and shop navigation
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    resetGame();
});

document.getElementById('shop-return-button').addEventListener('click', () => {
    window.location.href = 'index2.html';
});

function resetGame() {
    snake.segments = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameState = 'playing';
    spawnFood();
    updateUI();
}