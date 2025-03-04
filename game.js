/**
 * Snake Xtreme Game
 * A classic snake game with enhanced features
 */

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameCanvas = document.getElementById('game-canvas');
    const ctx = gameCanvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const achievementsElement = document.getElementById('achievements');
    const coinsElement = document.getElementById('coins');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreElement = document.getElementById('final-score');
    const highScoreDisplayElement = document.getElementById('high-score-display');
    const restartButton = document.getElementById('restart-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const menuButton = document.getElementById('menu-button');
    const leaderboardScreen = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    const backToGameButton = document.getElementById('back-to-game');
    
    // Game configuration
    const config = {
        gridSize: 20,
        cellSize: 20,
        initialSpeed: 150,
        colors: {
            snake: '#0f0',
            head: '#00ff00',
            food: '#ff0000',
            powerUp: '#ffff00',
            obstacle: '#888888',
            grid: '#333333',
            background: '#000000'
        },
        difficulties: {
            easy: { speed: 150 },
            medium: { speed: 100 },
            hard: { speed: 75 }
        }
    };
    
    // Game state variables
    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 10 };
    let powerUp = null;
    let obstacles = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let score = 0;
    let highScore = parseInt(localStorage.getItem('highScore')) || 0;
    let coins = parseInt(localStorage.getItem('coins')) || 0;
    let gameState = 'ready';
    let gameMode = localStorage.getItem('gameMode') || 'classic';
    let difficulty = localStorage.getItem('difficulty') || 'medium';
    let powerUpCount = 0;
    let gameStartTime = 0;
    let achievements = JSON.parse(localStorage.getItem('achievements')) || {
        score100: false,
        powerUp5: false,
        survive5Min: false
    };
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    // Game loop variables
    let gameLoop;
    let lastUpdateTime = 0;
    let speed = config.initialSpeed;
    
    // Retro effects
    let particles = [];
    const maxParticles = 100;
    
    // Set up canvas size
    gameCanvas.width = config.gridSize * config.cellSize;
    gameCanvas.height = config.gridSize * config.cellSize;
    
    // Add retro CRT effects
    function setupRetroEffects() {
        const gameContainer = document.getElementById('game-container');
        
        // Add CRT effect overlay
        const crtEffect = document.createElement('div');
        crtEffect.className = 'crt-effect';
        gameContainer.appendChild(crtEffect);
        
        // Add scanlines effect
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        gameContainer.appendChild(scanlines);
    }
    
    // Setup game
    function init() {
        // Set up retro effects
        setupRetroEffects();
        
        // Set up initial game state
        resetGame();
        
        // Show start message
        showMessage('PRESS SPACE<br>TO START');
        
        // Update displays
        updateDisplays();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Update display elements
    function updateDisplays() {
        scoreElement.textContent = `Score: ${score}`;
        highScoreElement.textContent = `High Score: ${highScore}`;
        achievementsElement.textContent = `Achievements: ${countAchievements()}/3`;
        coinsElement.textContent = `Coins: ${coins}`;
    }
    
    function countAchievements() {
        return Object.values(achievements).filter(achieved => achieved).length;
    }
    
    // Event listeners
    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);
        
        // Game over screen buttons
        restartButton.addEventListener('click', function() {
            gameOverScreen.style.display = 'none';
            resetGame();
            startGame();
        });
        
        leaderboardButton.addEventListener('click', function() {
            gameOverScreen.style.display = 'none';
            leaderboardScreen.style.display = 'block';
            updateLeaderboard();
        });
        
        menuButton.addEventListener('click', function() {
            // In a real app, you'd navigate to the menu
            console.log('Back to menu clicked');
        });
        
        backToGameButton.addEventListener('click', function() {
            leaderboardScreen.style.display = 'none';
            gameOverScreen.style.display = 'block';
        });
        
        // Touch controls for mobile
        setupTouchControls();
    }
    
    // Handle keyboard input
    function handleKeyPress(e) {
        // Space to start/restart
        if ((e.code === 'Space' || e.key === ' ') && (gameState === 'ready' || gameState === 'gameover')) {
            if (gameState === 'gameover') {
                resetGame();
                gameOverScreen.style.display = 'none';
            }
            
            // Remove message
            clearMessages();
            
            // Start game
            startGame();
            return;
        }
        
        // ESC to pause/resume
        if (e.code === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
            if (gameState === 'playing') {
                pauseGame();
            } else {
                resumeGame();
            }
            return;
        }
        
        // Direction controls
        if (gameState !== 'playing') return;
        
        switch(e.key) {
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
    
    // Touch controls for mobile
    function setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        gameCanvas.addEventListener('touchstart', function(e) {
            if (gameState === 'ready' || gameState === 'gameover') {
                if (gameState === 'gameover') {
                    resetGame();
                    gameOverScreen.style.display = 'none';
                }
                
                clearMessages();
                startGame();
                return;
            }
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        gameCanvas.addEventListener('touchmove', function(e) {
            if (gameState !== 'playing') return;
            
            e.preventDefault();
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Require a minimum swipe distance
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                // Horizontal swipe
                if (deltaX > 0 && direction.x !== -1) {
                    nextDirection = { x: 1, y: 0 };
                } else if (deltaX < 0 && direction.x !== 1) {
                    nextDirection = { x: -1, y: 0 };
                }
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                // Vertical swipe
                if (deltaY > 0 && direction.y !== -1) {
                    nextDirection = { x: 0, y: 1 };
                } else if (deltaY < 0 && direction.y !== 1) {
                    nextDirection = { x: 0, y: -1 };
                }
            }
            
            // Reset start position for next swipe
            touchStartX = touchX;
            touchStartY = touchY;
        });
    }
    
    // Start the game
    function startGame() {
        gameState = 'playing';
        gameStartTime = Date.now();
        
        // Set game speed based on difficulty
        speed = config.difficulties[difficulty].speed;
        
        // Start game loop
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameUpdate, speed);
    }
    
    // Pause the game
    function pauseGame() {
        gameState = 'paused';
        clearInterval(gameLoop);
        showMessage('PAUSED<br>PRESS ESC<br>TO RESUME');
    }
    
    // Resume the game
    function resumeGame() {
        gameState = 'playing';
        clearMessages();
        
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameUpdate, speed);
    }
    
    // Game over
    function gameOver() {
        gameState = 'gameover';
        clearInterval(gameLoop);
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        
        // Update leaderboard
        leaderboard.push(score);
        leaderboard.sort((a, b) => b - a);
        leaderboard = leaderboard.slice(0, 5); // Keep top 5 scores
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        
        // Show game over screen
        finalScoreElement.textContent = score;
        highScoreDisplayElement.textContent = highScore;
        gameOverScreen.style.display = 'block';
        
        // Play game over sound
        playSound('gameOver');
    }
    
    // Reset the game
    function resetGame() {
        snake = [{ x: 10, y: 10 }];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        powerUpCount = 0;
        obstacles = [];
        particles = [];
        
        // Reset food
        spawnFood();
        
        // Reset game state
        gameState = 'ready';
        
        updateDisplays();
    }
    
    // Main game update
    function gameUpdate() {
        // Move snake
        moveSnake();
        
        // Draw everything
        draw();
        
        // Check achievements
        checkAchievements();
    }
    
    // Move snake
    function moveSnake() {
        // Update direction
        direction = { ...nextDirection };
        
        // Calculate new head position
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;
        
        // Check for wall collisions based on game mode
        if (gameMode === 'no-walls') {
            // Wrap around edges
            head.x = (head.x + config.gridSize) % config.gridSize;
            head.y = (head.y + config.gridSize) % config.gridSize;
        } else {
            // Classic mode: die on wall collision
            if (head.x < 0 || head.x >= config.gridSize || head.y < 0 || head.y >= config.gridSize) {
                gameOver();
                return;
            }
        }
        
        // Check for collision with self
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }
        
        // Check for collision with obstacles
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].x === head.x && obstacles[i].y === head.y) {
                gameOver();
                return;
            }
        }
        
        // Add new head
        snake.unshift(head);
        
        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            coins++;
            localStorage.setItem('coins', coins);
            
            // Create particles for visual effect
            createFoodParticles(food.x, food.y);
            
            // Spawn new food
            spawnFood();
            
            // Occasionally spawn power-up or obstacles
            if (Math.random() < 0.3) spawnPowerUp();
            if (score >= 50 && obstacles.length === 0) spawnObstacles();
            
            // Play eat sound
            playSound('eat');
            
            // Update displays
            updateDisplays();
        } 
        // Check for power-up collision
        else if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
            powerUpCount++;
            powerUp = null;
            
            // Play power-up sound
            playSound('powerUp');
        } 
        // If no food/power-up was eaten, remove tail
        else {
            snake.pop();
        }
    }
    
    // Draw everything
    function draw() {
        // Clear canvas
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw snake
        drawSnake();
        
        // Draw food
        drawFood();
        
        // Draw power-up
        if (powerUp) {
            drawPowerUp();
        }
        
        // Draw obstacles
        drawObstacles();
        
        // Draw particles
        updateParticles();
    }
    
    // Draw grid
    function drawGrid() {
        ctx.strokeStyle = config.colors.grid;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= config.gridSize; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * config.cellSize, 0);
            ctx.lineTo(i * config.cellSize, config.gridSize * config.cellSize);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * config.cellSize);
            ctx.lineTo(config.gridSize * config.cellSize, i * config.cellSize);
            ctx.stroke();
        }
    }
    
    // Draw snake
    function drawSnake() {
        // Draw body
        for (let i = 1; i < snake.length; i++) {
            const segment = snake[i];
            ctx.fillStyle = config.colors.snake;
            
            // Draw rounded rectangle
            roundRect(
                ctx,
                segment.x * config.cellSize + 1,
                segment.y * config.cellSize + 1,
                config.cellSize - 2,
                config.cellSize - 2,
                4
            );
        }
        
        // Draw head (different color)
        const head = snake[0];
        ctx.fillStyle = config.colors.head;
        roundRect(
            ctx,
            head.x * config.cellSize + 1,
            head.y * config.cellSize + 1,
            config.cellSize - 2,
            config.cellSize - 2,
            4
        );
        
        // Draw eyes
        ctx.fillStyle = '#000';
        const eyeSize = config.cellSize / 6;
        let eyeX1, eyeX2, eyeY1, eyeY2;
        
        // Position eyes based on direction
        if (direction.x === 1) { // Right
            eyeX1 = eyeX2 = head.x * config.cellSize + config.cellSize * 3/4;
            eyeY1 = head.y * config.cellSize + config.cellSize / 3;
            eyeY2 = head.y * config.cellSize + config.cellSize * 2/3;
        } else if (direction.x === -1) { // Left
            eyeX1 = eyeX2 = head.x * config.cellSize + config.cellSize / 4;
            eyeY1 = head.y * config.cellSize + config.cellSize / 3;
            eyeY2 = head.y * config.cellSize + config.cellSize * 2/3;
        } else if (direction.y === -1) { // Up
            eyeX1 = head.x * config.cellSize + config.cellSize / 3;
            eyeX2 = head.x * config.cellSize + config.cellSize * 2/3;
            eyeY1 = eyeY2 = head.y * config.cellSize + config.cellSize / 4;
        } else { // Down
            eyeX1 = head.x * config.cellSize + config.cellSize / 3;
            eyeX2 = head.x * config.cellSize + config.cellSize * 2/3;
            eyeY1 = eyeY2 = head.y * config.cellSize + config.cellSize * 3/4;
        }
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw food with pulsating effect
    function drawFood() {
        const pulseAmount = 0.1;
        const pulseSpeed = 0.1;
        const pulse = Math.sin(Date.now() * pulseSpeed) * pulseAmount + 1;
        
        const centerX = food.x * config.cellSize + config.cellSize / 2;
        const centerY = food.y * config.cellSize + config.cellSize / 2;
        const radius = (config.cellSize / 2 - 2) * pulse;
        
        // Draw food as a star
        ctx.fillStyle = config.colors.food;
        drawStar(centerX, centerY, 5, radius, radius / 2);
    }
    
    // Draw power-up
    function drawPowerUp() {
        const pulseAmount = 0.2;
        const pulseSpeed = 0.15;
        const pulse = Math.sin(Date.now() * pulseSpeed) * pulseAmount + 1;
        
        const centerX = powerUp.x * config.cellSize + config.cellSize / 2;
        const centerY = powerUp.y * config.cellSize + config.cellSize / 2;
        const radius = (config.cellSize / 2 - 2) * pulse;
        
        // Draw power-up as a star
        ctx.fillStyle = config.colors.powerUp;
        drawStar(centerX, centerY, 5, radius, radius / 2);
    }
    
    // Draw obstacles
    function drawObstacles() {
        ctx.fillStyle = config.colors.obstacle;
        obstacles.forEach(obstacle => {
            ctx.fillRect(
                obstacle.x * config.cellSize,
                obstacle.y * config.cellSize,
                config.cellSize,
                config.cellSize
            );
        });
    }
    
    // Create food particles
    function createFoodParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x * config.cellSize + config.cellSize / 2,
                y: y * config.cellSize + config.cellSize / 2,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                alpha: 1
            });
        }
    }
    
    // Update particles
    function updateParticles() {
        particles.forEach((particle, index) => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.alpha -= 0.02;
            
            if (particle.alpha <= 0) {
                particles.splice(index, 1);
            }
        });
        
        particles.forEach(particle => {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Spawn food
    function spawnFood() {
        while (true) {
            const newFood = {
                x: Math.floor(Math.random() * config.gridSize),
                y: Math.floor(Math.random() * config.gridSize)
            };
            
            if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
                !obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)) {
                food = newFood;
                break;
            }
        }
    }
    
    // Spawn power-up
    function spawnPowerUp() {
        while (true) {
            const newPowerUp = {
                x: Math.floor(Math.random() * config.gridSize),
                y: Math.floor(Math.random() * config.gridSize)
            };
            
            if (!snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) &&
                !obstacles.some(obstacle => obstacle.x === newPowerUp.x && obstacle.y === newPowerUp.y) &&
                (newPowerUp.x !== food.x || newPowerUp.y !== food.y)) {
                powerUp = newPowerUp;
                break;
            }
        }
    }
    
    // Spawn obstacles
    function spawnObstacles() {
        for (let i = 0; i < 3; i++) {
            while (true) {
                const newObstacle = {
                    x: Math.floor(Math.random() * config.gridSize),
                    y: Math.floor(Math.random() * config.gridSize)
                };
                
                if (!snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y) &&
                    (newObstacle.x !== food.x || newObstacle.y !== food.y) &&
                    (!powerUp || (newObstacle.x !== powerUp.x || newObstacle.y !== powerUp.y))) {
                    obstacles.push(newObstacle);
                    break;
                }
            }
        }
    }
    
    // Check achievements
    function checkAchievements() {
        if (score >= 100 && !achievements.score100) {
            achievements.score100 = true;
            showMessage('Achievement: Score 100!', 2000);
        }
        if (powerUpCount >= 5 && !achievements.powerUp5) {
            achievements.powerUp5 = true;
            showMessage('Achievement: Collect 5 Power-Ups!', 2000);
        }
        if (Date.now() - gameStartTime >= 300000 && !achievements.survive5Min) {
            achievements.survive5Min = true;
            showMessage('Achievement: Survive 5 Minutes!', 2000);
        }
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }
    
    // Update leaderboard
    function updateLeaderboard() {
        leaderboardList.innerHTML = '';
        leaderboard.forEach((score, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${score}`;
            leaderboardList.appendChild(li);
        });
    }
    
    // Show message
    function showMessage(message, duration) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.innerHTML = message;
        document.body.appendChild(messageElement);
        
        if (duration) {
            setTimeout(() => {
                messageElement.remove();
            }, duration);
        }
    }
    
    // Clear messages
    function clearMessages() {
        document.querySelectorAll('.game-message').forEach(message => {
            message.remove();
        });
    }
    
    // Play sound
    function playSound(sound) {
        const audio = new Audio(`sounds/${sound}.mp3`);
        audio.play();
    }
    
    // Draw rounded rectangle
    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw star
    function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
    
    // Initialize game
    init();
});