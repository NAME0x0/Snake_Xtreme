// Game variables
let app, snake, food, powerUp, obstacles = [], trail = [], easterEgg;
const gridSize = 20, cellSize = 20;
let direction = { x: 1, y: 0 }, nextDirection = { x: 1, y: 0 };
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let gameState = 'ready', gameMode = localStorage.getItem('gameMode') || 'classic';
let cheatCode = '', invincibility = false, powerUpCount = 0, gameStartTime = 0;
let achievements = JSON.parse(localStorage.getItem('achievements')) || { score100: false, powerUp5: false, survive5Min: false };
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let config = { snakeColors: {}, difficulties: {} };
let gameEnhancement, particles = [];
let selectedColor = localStorage.getItem('selectedColor') || 'green';
let difficulty = localStorage.getItem('difficulty') || 'medium';

// Add missing object declaration
const eventHandlers = {
  keydown: null
};

// Fix animation frame handling and performance issues
let lastMoveTime = 0;
let lastRenderTime = 0;
let animationRequestId = null;
const FRAME_RATE_LIMIT = 60; // Cap at 60fps for performance
const FRAME_INTERVAL = 1000 / FRAME_RATE_LIMIT;

// Add missing declaration for touchControls
let touchControls = null;

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

// Initialize game enhancement with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize RenderUtils first
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        if (RenderUtils && typeof RenderUtils.init === 'function') {
            RenderUtils.init(ctx);
        }
        
        // Then initialize game enhancement
        gameEnhancement = new GameEnhancement(document.getElementById('game-container'));
        
        // Show start message
        showStartMessage();
        
        // Setup event listeners after DOM is fully loaded
        setupEventListeners();
        
        // Initialize touch controls last (after other UI is set up)
        initializeTouchControls();
    } catch (error) {
        console.error("Error initializing game:", error);
        // Provide fallback initialization to ensure game works
        showStartMessage();
        setupEventListeners();
    }
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

// Snake setup with improved visibility
snake = { 
    segments: [{ x: 10, y: 10 }], 
    graphics: new PIXI.Graphics(),
    // Add these properties for the RenderUtils to work
    body: [{ x: 10, y: 10 }],
    direction: 'RIGHT'
};
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
    
    // Update game enhancement score if available
    if (gameEnhancement) {
        gameEnhancement.updateScore(score);
    }
}

// Spawn functions
function spawnFood() {
    do {
        food.gridX = Math.floor(Math.random() * gridSize);
        food.gridY = Math.floor(Math.random() * gridSize);
    } while (snake.segments.some(seg => seg.x === food.gridX && seg.y === food.gridY) ||
             obstacles.some(obs => obs.gridX === food.gridX && obs.gridY === food.gridY));
    
    // Update food object for RenderUtils
    food.x = food.gridX;
    food.y = food.gridY;
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

// Drawing functions with enhanced rendering
function drawSnake() {
    // Update snake body for RenderUtils
    snake.body = snake.segments.map(seg => ({ x: seg.x, y: seg.y }));
    
    // Set direction for RenderUtils
    if (direction.x === 1) snake.direction = 'RIGHT';
    else if (direction.x === -1) snake.direction = 'LEFT';
    else if (direction.y === 1) snake.direction = 'DOWN';
    else if (direction.y === -1) snake.direction = 'UP';
    
    // Use custom renderer with canvas context
    const renderer = app.renderer;
    renderer.plugins.interaction.calculatePointerPosition();
    const ctx = document.getElementById('game-canvas').getContext('2d');
    
    // Clear the specific area where snake is
    ctx.clearRect(0, 0, gridSize * cellSize, gridSize * cellSize);
    
    // Draw grid background
    RenderUtils.drawGrid(ctx, gridSize * cellSize, gridSize * cellSize, cellSize);
    
    // Draw enhanced snake
    RenderUtils.drawSnake(ctx, snake, cellSize);
    
    // Update particles if any
    if (particles.length > 0) {
        RenderUtils.updateParticles(ctx, particles);
    }
}

function drawFood() {
    // Use custom renderer with canvas context
    const renderer = app.renderer;
    renderer.plugins.interaction.calculatePointerPosition();
    const ctx = document.getElementById('game-canvas').getContext('2d');
    
    // Draw food with pulsating effect
    RenderUtils.drawFood(ctx, food, cellSize, Date.now());
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

// Show start message
function showStartMessage() {
    const startMessage = document.createElement('div');
    startMessage.id = 'start-message';
    startMessage.className = 'game-message game-ui';
    startMessage.innerHTML = 'PRESS SPACE<br>TO START';
    gameContainer.appendChild(startMessage);
    
    // Update game state
    gameState = 'ready';
    window.gameState = 'ready'; // Expose gameState to TouchControls
}

// Consolidated event listeners
function setupEventListeners() {
    // Remove existing event listener if present to avoid duplicates
    if (eventHandlers.keydown) {
        document.removeEventListener('keydown', eventHandlers.keydown);
    }
    
    eventHandlers.keydown = function(event) {
        // Fix: Handle Space key correctly (both code and key for compatibility)
        if ((event.code === 'Space' || event.key === ' ') && 
            (gameState === 'ready' || gameState === 'gameover')) {
            
            // Log to ensure this is being called
            console.log('Space pressed, game starting!');
            
            if (gameState === 'gameover') {
                resetGame();
                gameOverScreen.style.display = 'none';
            }
            
            // Remove start message if exists
            const startMessage = document.getElementById('start-message');
            if (startMessage) {
                startMessage.remove();
            }
            
            gameState = 'playing';
            window.gameState = 'playing'; // Update global state
            gameStartTime = performance.now();
            return;
        }
        
        // Handle ESC key to pause/resume
        if (event.code === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
            if (gameState === 'playing') {
                gameState = 'paused';
                showPauseMessage();
            } else {
                gameState = 'playing';
                const pauseMessage = document.getElementById('pause-message');
                if (pauseMessage) {
                    pauseMessage.remove();
                }
            }
            return;
        }
        
        // Direction controls
        if (gameState === 'playing') {
            switch (event.key) {
                case 'ArrowUp': 
                case 'w':
                case 'W':
                    if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; 
                    break;
                case 'ArrowDown': 
                case 's':
                case 'S':
                    if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; 
                    break;
                case 'ArrowLeft': 
                case 'a':
                case 'A':
                    if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; 
                    break;
                case 'ArrowRight': 
                case 'd': 
                case 'D':
                    if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; 
                    break;
            }
        }
        
        // Cheat code detection
        cheatCode += event.key.toLowerCase();
        if (cheatCode.includes('iddqd')) {
            invincibility = true;
            showTemporaryMessage('Cheat: Invincibility ON!', 1500);
            cheatCode = '';
        }
    };
    
    document.addEventListener('keydown', eventHandlers.keydown);
    
    // Setup button event listeners
    const buttonElements = {
        restart: document.getElementById('restart-button'),
        leaderboard: document.getElementById('leaderboard-button'),
        backToGame: document.getElementById('back-to-game'),
        menu: document.getElementById('menu-button')
    };
    
    // Ensure elements exist before adding listeners
    if (buttonElements.restart) {
        buttonElements.restart.addEventListener('click', () => {
            gameOverScreen.style.display = 'none';
            resetGame();
        });
    }
    
    if (buttonElements.leaderboard) {
        buttonElements.leaderboard.addEventListener('click', () => {
            gameOverScreen.style.display = 'none';
            leaderboardScreen.style.display = 'block';
            updateLeaderboard();
        });
    }
    
    if (buttonElements.backToGame) {
        buttonElements.backToGame.addEventListener('click', () => {
            leaderboardScreen.style.display = 'none';
            gameOverScreen.style.display = 'block';
        });
    }
    
    if (buttonElements.menu) {
        buttonElements.menu.addEventListener('click', () => window.location.href = 'index1.html');
    }
    
    // Make sure touch controls and keyboard input work together
    if (touchControls) {
        touchControls.onDirectionChange = (directionString) => {
            // Only update direction if game is in playing state
            if (gameState !== 'playing') return;
            
            // Convert direction string to vector
            switch(directionString) {
                case 'UP': 
                    if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; 
                    break;
                case 'DOWN': 
                    if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; 
                    break;
                case 'LEFT': 
                    if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; 
                    break;
                case 'RIGHT': 
                    if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; 
                    break;
            }
        };
    }
}

// Update leaderboard display
function updateLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((score, i) => {
        const li = document.createElement('li');
        li.textContent = `#${i + 1}: ${score}`;
        leaderboardList.appendChild(li);
    });
}

// Show a temporary message instead of using alert()
function showTemporaryMessage(message, duration) {
    try {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'game-message game-ui temp-message';
        messageEl.textContent = message;
        gameContainer.appendChild(messageEl);
        
        // Remove after duration with safety check
        const timeout = setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, duration);
        
        // Store timeout for cleanup
        return timeout;
    } catch (error) {
        console.error("Error showing message:", error);
        return null;
    }
}

// Show pause message
function showPauseMessage() {
    const pauseMessage = document.createElement('div');
    pauseMessage.id = 'pause-message';
    pauseMessage.className = 'game-message game-ui';
    pauseMessage.innerHTML = 'PAUSED<br>PRESS ESC<br>TO RESUME';
    gameContainer.appendChild(pauseMessage);
}

// Game loop - optimize rendering
function initializeGame() {
    // Get difficulty settings
    difficulty = localStorage.getItem('difficulty') || 'medium';
    const moveInterval = config.difficulties[difficulty]?.speed || 100;
    
    // Initialize RenderUtils if not already done
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    if (RenderUtils && typeof RenderUtils.init === 'function') {
        RenderUtils.init(ctx);
    }
    
    // Fix: Do a complete canvas clear on initialization
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use requestAnimationFrame with throttling for better performance
    function gameLoop(timestamp) {
        // Calculate elapsed time
        const elapsed = timestamp - lastRenderTime;
        
        // Only render if enough time has passed (frame rate limiting)
        if (elapsed > FRAME_INTERVAL) {
            lastRenderTime = timestamp - (elapsed % FRAME_INTERVAL);
            
            if (gameState === 'playing') {
                // Update game state
                if (timestamp - lastMoveTime >= moveInterval) {
                    moveSnake();
                    lastMoveTime = timestamp;
                }
                
                // Fix: Full clear on each frame
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Render only what's needed
                drawSnake();
                drawFood();
                
                // Update particles if there are any
                if (gameEnhancement && gameEnhancement.particles.length > 0) {
                    gameEnhancement.updateParticles(ctx);
                }
            }
        }
        
        // Continue the loop
        animationRequestId = requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    if (animationRequestId) {
        cancelAnimationFrame(animationRequestId);
    }
    animationRequestId = requestAnimationFrame(gameLoop);
    
    // Make sure UI elements are visible
    updateDisplays();
    
    // Start in 'ready' state, waiting for spacebar
    gameState = 'ready';
    window.gameState = 'ready'; // Update global state
    showStartMessage();
}

// Movement logic with enhanced effects
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

    // Play move sound occasionally
    if (gameEnhancement) {
        gameEnhancement.playMoveSound();
    }

    if (head.x === food.gridX && head.y === food.gridY) {
        score += 10;
        coins += 1;
        setLocalStorageItem('coins', coins);
        
        // Create food particles
        if (gameEnhancement) {
            gameEnhancement.createFoodParticles(food.gridX, food.gridY, cellSize);
        } else {
            particles = [...particles, ...RenderUtils.createFoodParticles(food.gridX, food.gridY, cellSize)];
        }
        
        // Screen shake effect
        if (gameEnhancement) {
            gameEnhancement.screenShake();
        }
        
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
        handleEasterEggCollected();
    } else {
        snake.segments.pop();
    }
    checkAchievements();
    updateDisplays();
}

// Achievements logic - show notifications instead of alerts
function checkAchievements() {
    if (score >= 100 && !achievements.score100) {
        achievements.score100 = true;
        showTemporaryMessage('Achievement: Score 100!', 2000);
    }
    if (powerUpCount >= 5 && !achievements.powerUp5) {
        achievements.powerUp5 = true;
        showTemporaryMessage('Achievement: Collect 5 Power-Ups!', 2000);
    }
    if (performance.now() - gameStartTime >= 300000 && !achievements.survive5Min) {
        achievements.survive5Min = true;
        showTemporaryMessage('Achievement: Survive 5 Minutes!', 2000);
    }
    setLocalStorageItem('achievements', achievements);
}

// Game over with enhanced effects
function endGame() {
    gameState = 'gameover';
    if (score > highScore) highScore = score;
    localStorage.setItem('highScore', highScore);
    leaderboard.push(score);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    // Play game over sound and show message
    if (gameEnhancement) {
        gameEnhancement.playGameOverSound();
    }
    
    gameOverScreen.style.display = 'block';
    finalScoreDisplay.textContent = score;
    highScoreGameOverDisplay.textContent = highScore;
}

function resetGame() {
    snake.segments = [{ x: 10, y: 10 }];
    snake.body = [{ x: 10, y: 10 }]; // For RenderUtils
    snake.direction = 'RIGHT'; // For RenderUtils
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
    particles = [];
    spawnFood();
    gameState = 'playing';
    gameStartTime = performance.now();
    updateDisplays();
    
    // Reset enhancements
    if (gameEnhancement) {
        gameEnhancement.hideMessage();
    }
    
    gameState = 'ready';
    showStartMessage();
}

// Clean up resources on game exit
function cleanupResources() {
    // Cancel animation frame
    if (animationRequestId) {
        cancelAnimationFrame(animationRequestId);
        animationRequestId = null;
    }
    
    // Remove event listeners
    if (eventHandlers.keydown) {
        document.removeEventListener('keydown', eventHandlers.keydown);
        eventHandlers.keydown = null;
    }
    
    // Clean up enhancements
    if (gameEnhancement) {
        try {
            gameEnhancement.cleanup();
        } catch (error) {
            console.error("Error cleaning up game enhancement:", error);
        }
    }
    
    // Clean up touch controls
    if (touchControls) {
        touchControls.disable();
        touchControls = null;
    }
    
    // Clear any references that could cause memory leaks
    snake = null;
    food = null;
    powerUp = null;
    obstacles = [];
    trail = [];
    particles = [];
}

// Add this to prevent memory leaks when leaving the page
window.addEventListener('beforeunload', cleanupResources);

// Improved easter egg handling
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

// Update Easter Egg encounter
function handleEasterEggCollected() {
    score += 50;
    coins += 10;
    setLocalStorageItem('coins', coins);
    app.stage.removeChild(easterEgg);
    easterEgg = null;
    showTemporaryMessage('Easter Egg: Hidden treasure found!', 2000);
}

// Safer localStorage access
function getLocalStorageItem(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error(`Error accessing localStorage for key ${key}:`, error);
        return defaultValue;
    }
}

function setLocalStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error storing to localStorage for key ${key}:`, error);
        return false;
    }
}

// Separate touch controls initialization
function initializeTouchControls() {
    try {
        touchControls = new TouchControls(gameContainer);
        touchControls.init((directionString) => {
            // Only update direction if game is in playing state
            if (gameState !== 'playing') return;
            
            // Convert direction string to vector
            switch(directionString) {
                case 'UP': 
                    if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; 
                    break;
                case 'DOWN': 
                    if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; 
                    break;
                case 'LEFT': 
                    if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; 
                    break;
                case 'RIGHT': 
                    if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; 
                    break;
            }
        });
        
        // Enable tap to start/restart
        touchControls.enableTapToStart();
    } catch (error) {
        console.error("Error initializing touch controls:", error);
    }
}