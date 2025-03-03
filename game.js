// Game variables
let app, snake, food, powerUp, obstacles = [], trail = [], easterEgg;
const gridSize = 20, cellSize = 20;
let direction = { x: 1, y: 0 }, nextDirection = { x: 1, y: 0 };
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let gameState = 'playing', gameMode = localStorage.getItem('gameMode') || 'classic';
let cheatCode = '', invincibility = false, powerUpCount = 0, gameStartTime = 0;
let achievements = JSON.parse(localStorage.getItem('achievements')) || { score100: false, powerUp5: false, survive5Min: false };
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let config = { snakeColors: {}, difficulties: {} };

// Load configuration
fetch('config.xml')
    .then(response => response.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
        const colors = data.querySelectorAll('snakeColors color');
        colors.forEach(color => {
            const name = color.getAttribute('name');
            config.snakeColors[name] = { hex: color.getAttribute('hex') };
        });
        const difficulties = data.querySelectorAll('difficulties difficulty');
        difficulties.forEach(diff => {
            const level = diff.getAttribute('level');
            config.difficulties[level] = { speed: parseInt(diff.getAttribute('speed')) };
        });
        initializeGame();
    });

// Pixi.js setup
app = new PIXI.Application({
    width: gridSize * cellSize,
    height: gridSize * cellSize,
    backgroundColor: 0x000000,
    view: document.getElementById('game-canvas')
});
document.getElementById('game-container').appendChild(app.view);

// Grid background
const gridGraphics = new PIXI.Graphics();
gridGraphics.lineStyle(1, 0x333333);
for (let i = 0; i <= gridSize; i++) {
    gridGraphics.moveTo(i * cellSize, 0);
    gridGraphics.lineTo(i * cellSize, gridSize * cellSize);
    gridGraphics.moveTo(0, i * cellSize);
    gridGraphics.lineTo(gridSize * cellSize, i * cellSize);
}
app.stage.addChild(gridGraphics);

// Snake setup
snake = { segments: [{ x: 10, y: 10 }], graphics: new PIXI.Graphics() };
app.stage.addChild(snake.graphics);
food = new PIXI.Graphics();
app.stage.addChild(food);
spawnFood();

// UI references
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const achievementsDisplay = document.getElementById('achievements');
const coinsDisplay = document.getElementById('coins');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreGameOverDisplay = document.getElementById('high-score-display');
const leaderboardScreen = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');

// Update displays
function updateDisplays() {
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    achievementsDisplay.textContent = `Achievements: ${Object.values(achievements).filter(a => a).length}/3`;
    coinsDisplay.textContent = `Coins: ${coins}`;
    finalScoreDisplay.textContent = score;
    highScoreGameOverDisplay.textContent = highScore;
}

// Spawn functions
function spawnFood() {
    do {
        food.gridX = Math.floor(Math.random() * gridSize);
        food.gridY = Math.floor(Math.random() * gridSize);
    } while (snake.segments.some(seg => seg.x === food.gridX && seg.y === food.gridY) ||
             obstacles.some(obs => obs.gridX === food.gridX && obs.gridY === food.gridY));
    drawFood();
}

function spawnPowerUp() {
    if (powerUp) app.stage.removeChild(powerUp);
    powerUp = new PIXI.Graphics();
    do {
        powerUp.gridX = Math.floor(Math.random() * gridSize);
        powerUp.gridY = Math.floor(Math.random() * gridSize);
    } while (snake.segments.some(seg => seg.x === powerUp.gridX && seg.y === powerUp.gridY) ||
             obstacles.some(obs => obs.gridX === powerUp.gridX && obs.gridY === powerUp.gridY));
    powerUp.beginFill(0xffff00);
    powerUp.drawCircle(powerUp.gridX * cellSize + cellSize / 2, powerUp.gridY * cellSize + cellSize / 2, cellSize / 2);
    powerUp.endFill();
    app.stage.addChild(powerUp);
}

function spawnObstacles() {
    for (let i = 0; i < 3; i++) {
        const obstacle = new PIXI.Graphics();
        do {
            obstacle.gridX = Math.floor(Math.random() * gridSize);
            obstacle.gridY = Math.floor(Math.random() * gridSize);
        } while (snake.segments.some(seg => seg.x === obstacle.gridX && seg.y === obstacle.gridY));
        obstacle.beginFill(0x888888);
        obstacle.drawRect(obstacle.gridX * cellSize, obstacle.gridY * cellSize, cellSize, cellSize);
        obstacle.endFill();
        app.stage.addChild(obstacle);
        obstacles.push(obstacle);
    }
}

function spawnEasterEgg() {
    if (easterEgg) return;
    easterEgg = new PIXI.Graphics();
    easterEgg.gridX = 5;
    easterEgg.gridY = 5;
    easterEgg.beginFill(0xff00ff);
    easterEgg.drawCircle(easterEgg.gridX * cellSize + cellSize / 2, easterEgg.gridY * cellSize + cellSize / 2, cellSize / 2);
    easterEgg.endFill();
    app.stage.addChild(easterEgg);
}

// Drawing functions
function drawSnake() {
    snake.graphics.clear();
    snake.graphics.beginFill(PIXI.utils.string2hex(config.snakeColors[selectedColor].hex));
    snake.segments.forEach(seg => snake.graphics.drawRoundedRect(seg.x * cellSize, seg.y * cellSize, cellSize - 2, cellSize - 2, 5));
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
            trailGraphics.beginFill(PIXI.utils.string2hex(config.snakeColors[selectedColor].hex), alpha);
            trailGraphics.drawRoundedRect(t.x * cellSize, t.y * cellSize, cellSize - 2, cellSize - 2, 5);
            trailGraphics.endFill();
            app.stage.addChild(trailGraphics);
            setTimeout(() => app.stage.removeChild(trailGraphics), 100);
        }
    });
}

// Game loop
let lastMoveTime = 0;
function initializeGame() {
    const selectedColor = localStorage.getItem('selectedColor') || 'green';
    const difficulty = localStorage.getItem('difficulty') || 'medium';
    const moveInterval = config.difficulties[difficulty].speed;

    let ticker = PIXI.Ticker.shared;
    ticker.add((delta) => {
        if (gameState !== 'playing') return;
        const currentTime = performance.now();
        if (currentTime - lastMoveTime >= moveInterval) {
            moveSnake();
            drawSnake();
            drawTrail();
            updateDisplays();
            lastMoveTime = currentTime;
        }
    });
    gameContainer.style.display = 'block'; // Show game when loaded
    gameStartTime = performance.now();
}

// Movement logic
function moveSnake() {
    direction = { ...nextDirection };
    let head = { x: snake.segments[0].x + direction.x, y: snake.segments[0].y + direction.y };

    if (gameMode === 'no-walls') {
        head.x = (head.x + gridSize) % gridSize;
        head.y = (head.y + gridSize) % gridSize;
    } else if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        if (!invincibility) endGame();
        return;
    }

    if (snake.segments.some(seg => seg.x === head.x && seg.y === head.y) ||
        obstacles.some(obs => obs.gridX === head.x && obs.gridY === head.y)) {
        if (!invincibility) endGame();
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
        if (Math.random() < 0.3) spawnPowerUp();
        if (score >= 50 && obstacles.length === 0) spawnObstacles();
        if (score >= 100 && !easterEgg) spawnEasterEgg();
    } else if (powerUp && head.x === powerUp.gridX && head.y === powerUp.gridY) {
        powerUpCount++;
        app.stage.removeChild(powerUp);
        powerUp = null;
        spawnPowerUp();
    } else if (easterEgg && head.x === easterEgg.gridX && head.y === easterEgg.gridY) {
        score += 50;
        coins += 10;
        localStorage.setItem('coins', coins);
        app.stage.removeChild(easterEgg);
        easterEgg = null;
        alert('Easter Egg: Hidden treasure found!');
    } else {
        snake.segments.pop();
    }
    checkAchievements();
}

// Achievements logic
function checkAchievements() {
    if (score >= 100 && !achievements.score100) {
        achievements.score100 = true;
        alert('Achievement: Score 100!');
    }
    if (powerUpCount >= 5 && !achievements.powerUp5) {
        achievements.powerUp5 = true;
        alert('Achievement: Collect 5 Power-Ups!');
    }
    if (performance.now() - gameStartTime >= 300000 && !achievements.survive5Min) {
        achievements.survive5Min = true;
        alert('Achievement: Survive 5 Minutes!');
    }
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

// Game over
function endGame() {
    gameState = 'gameover';
    if (score > highScore) highScore = score;
    localStorage.setItem('highScore', highScore);
    leaderboard.push(score);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    gameOverScreen.style.display = 'block';
}

// Cheat code
document.addEventListener('keydown', (event) => {
    cheatCode += event.key.toLowerCase();
    if (cheatCode.includes('iddqd')) {
        invincibility = true;
        alert('Cheat: Invincibility ON!');
        cheatCode = '';
    }
});

// Input handling
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp': if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
    }
});

// UI interactions
document.getElementById('restart-button').addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    resetGame();
});

document.getElementById('leaderboard-button').addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'block';
    leaderboardList.innerHTML = '';
    leaderboard.forEach((score, i) => {
        const li = document.createElement('li');
        li.textContent = `#${i + 1}: ${score}`;
        leaderboardList.appendChild(li);
    });
});

document.getElementById('back-to-game').addEventListener('click', () => {
    leaderboardScreen.style.display = 'none';
    gameOverScreen.style.display = 'block';
});

document.getElementById('menu-button').addEventListener('click', () => window.location.href = 'index1.html');

function resetGame() {
    snake.segments = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    powerUpCount = 0;
    invincibility = false;
    obstacles.forEach(obs => app.stage.removeChild(obs));
    obstacles = [];
    if (powerUp) app.stage.removeChild(powerUp);
    powerUp = null;
    if (easterEgg) app.stage.removeChild(easterEgg);
    easterEgg = null;
    trail = [];
    spawnFood();
    gameState = 'playing';
    gameStartTime = performance.now();
    updateDisplays();
}