/**
 * Snake Xtreme Game
 * A modern, feature-rich implementation of the classic Snake game
 */

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Constants
const GAME_STATES = {
    MENU: 'menu',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

const GAME_MODES = {
    CLASSIC: 'classic',
    NO_WALLS: 'no-walls',
    TIME_ATTACK: 'time-attack',
    MAZE: 'maze'
};

const DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

const POWER_UP_TYPES = {
    SPEED: 'speed',
    SLOW: 'slow',
    INVINCIBLE: 'invincible',
    SCORE_MULTIPLIER: 'score-multiplier',
    SHRINK: 'shrink'
};

const FOOD_TYPES = {
    REGULAR: 'regular',
    BONUS: 'bonus',
    SPECIAL: 'special'
};

const ACHIEVEMENT_TYPES = {
    SCORE_100: 'score100',
    POWER_UP_5: 'powerUp5',
    SURVIVE_5_MIN: 'survive5Min'
};

const ACHIEVEMENT_THRESHOLDS = {
    SCORE: 100,
    POWER_UPS: 5,
    SURVIVAL_TIME: 300000 // 5 minutes in milliseconds
};

const PARTICLE_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    OFF: 'off'
};

const PARTICLE_COUNTS = {
    [PARTICLE_LEVELS.HIGH]: 20,
    [PARTICLE_LEVELS.MEDIUM]: 10,
    [PARTICLE_LEVELS.LOW]: 5,
    [PARTICLE_LEVELS.OFF]: 0
};

const LEADERBOARD_MAX_SIZE = 5;
const MIN_SWIPE_DISTANCE = 30;
const ANIMATION_DURATION = 150; // ms for movement animation
const POWER_UP_CHANCE = 0.3;
const POWER_UP_DURATION = 5000; // 5 seconds
const TIME_ATTACK_DURATION = 60; // 60 seconds
const OBSTACLE_COUNT = 3;

// DOM Elements
const domElements = {
    // Canvas and game elements
    gameCanvas: document.getElementById('game-canvas'),
    ui: document.getElementById('ui'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    achievementsCount: document.getElementById('achievements-count'),
    coins: document.getElementById('coins'),
    timer: document.getElementById('timer'),
    pauseButton: document.getElementById('pause-button'),
    mobileControls: document.getElementById('mobile-controls'),
    
    // Main menu elements
    mainMenu: document.getElementById('main-menu'),
    playButton: document.getElementById('play-button'),
    shopButton: document.getElementById('shop-button'),
    settingsButton: document.getElementById('settings-button'),
    achievementsButton: document.getElementById('achievements-button'),
    usernameInput: document.getElementById('username-input'),
    mainCoins: document.getElementById('main-coins').querySelector('span'),
    
    // Game modes
    classicMode: document.getElementById('classic-mode'),
    noWallsMode: document.getElementById('no-walls-mode'),
    timeAttackMode: document.getElementById('time-attack-mode'),
    mazeMode: document.getElementById('maze-mode'),
    
    // Difficulty buttons
    easyMode: document.getElementById('easy-mode'),
    mediumMode: document.getElementById('medium-mode'),
    hardMode: document.getElementById('hard-mode'),
    
    // Game over screen
    gameOverScreen: document.getElementById('game-over-screen'),
    finalScore: document.getElementById('final-score'),
    highScoreDisplay: document.getElementById('high-score-display'),
    restartButton: document.getElementById('restart-button'),
    leaderboardButton: document.getElementById('leaderboard-button'),
    menuButton: document.getElementById('menu-button'),
    
    // Social sharing
    shareTwitter: document.getElementById('share-twitter'),
    shareFacebook: document.getElementById('share-facebook'),
    copyScore: document.getElementById('copy-score'),
    
    // Leaderboard
    leaderboard: document.getElementById('leaderboard'),
    leaderboardList: document.getElementById('leaderboard-list'),
    backToGame: document.getElementById('back-to-game'),
    
    // Pause menu
    pauseMenu: document.getElementById('pause-menu'),
    resumeButton: document.getElementById('resume-button'),
    restartFromPauseButton: document.getElementById('restart-from-pause-button'),
    settingsFromPauseButton: document.getElementById('settings-from-pause-button'),
    menuFromPauseButton: document.getElementById('menu-from-pause-button'),
    
    // Shop
    snakeShop: document.getElementById('snake-shop'),
    shopItems: document.querySelector('.shop-items'),
    shopCoins: document.querySelector('.shop-coins span'),
    backToMenuFromShop: document.getElementById('back-to-menu-from-shop'),
    
    // Settings
    settingsMenu: document.getElementById('settings-menu'),
    particleEffects: document.getElementById('particle-effects'),
    soundVolume: document.getElementById('sound-volume'),
    gridVisibility: document.getElementById('grid-visibility'),
    crtEffect: document.getElementById('crt-effect'),
    highContrast: document.getElementById('high-contrast'),
    backToMenuFromSettings: document.getElementById('back-to-menu-from-settings'),
    
    // Achievements screen
    achievementsScreen: document.getElementById('achievements-screen'),
    achievementsList: document.querySelector('.achievements-list'),
    backToMenuFromAchievements: document.getElementById('back-to-menu-from-achievements'),
    
    // CRT Effects
    crtEffectElement: document.querySelector('.crt-effect'),
    scanlinesElement: document.querySelector('.scanlines')
};

const ctx = domElements.gameCanvas.getContext('2d');

// Game configuration - will be populated from config.json
let config = {
    gridSize: 20,
    cellSize: 20,
    initialSpeed: 150,
    colors: {
        snake: '#0f0',
        head: '#00ff00',
        food: '#ff0000',
        bonus: '#ff8800',
        special: '#ff00ff',
        powerUps: {
            speed: '#ffff00',
            slow: '#0088ff',
            invincible: '#ffffff',
            scoreMultiplier: '#ff00ff',
            shrink: '#00ffff'
        },
        obstacle: '#888888',
        grid: '#333333',
        background: '#000000'
    },
    difficulties: {
        [DIFFICULTIES.EASY]: { speed: 150 },
        [DIFFICULTIES.MEDIUM]: { speed: 100 },
        [DIFFICULTIES.HARD]: { speed: 75 }
    },
    snakeColors: []
};

// Game state
const gameState = {
    snake: [{ x: 10, y: 10 }],
    snakeColor: '#0f0',
    food: { x: 15, y: 10, type: FOOD_TYPES.REGULAR },
    powerUp: null,
    powerUpActive: null,
    powerUpTimer: null,
    obstacles: [],
    direction: { ...DIRECTIONS.RIGHT },
    nextDirection: { ...DIRECTIONS.RIGHT },
    score: 0,
    scoreMultiplier: 1,
    highScore: 0,
    coins: 0,
    state: GAME_STATES.MENU,
    gameMode: GAME_MODES.CLASSIC,
    difficulty: DIFFICULTIES.MEDIUM,
    powerUpCount: 0,
    gameStartTime: 0,
    achievements: {},
    leaderboard: [],
    particles: [],
    username: '',
    mazePattern: [],
    timeLeft: TIME_ATTACK_DURATION,
    isInvincible: false
};

// Settings
const settings = {
    particleEffects: PARTICLE_LEVELS.MEDIUM,
    soundVolume: 70,
    gridVisibility: true,
    crtEffect: true,
    highContrast: false
};

// Animation state for smooth movement
const animationState = {
    animating: false,
    startTime: 0,
    startPositions: [],
    targetPositions: []
};

// Game loop variables
let gameLoop;
let animationFrame;
let timeAttackInterval;
let lastUpdateTime = 0;
let speed = config.initialSpeed;

// Audio objects for preloading
const sounds = {};

// Load game configuration from JSON
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const configData = await response.json();
        
        // Update difficulty settings
        configData.difficulties.forEach(difficultyOption => {
            config.difficulties[difficultyOption.level] = { 
                speed: difficultyOption.speed 
            };
        });
        
        // Add snake colors to config
        config.snakeColors = configData.snakeColors;
    } catch (error) {
        console.error('Error loading config:', error);
        // Continue with default config if loading fails
    }
}

// Load game data from localStorage
function loadGameData() {
    try {
        gameState.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        gameState.coins = parseInt(localStorage.getItem('coins')) || 0;
        gameState.gameMode = localStorage.getItem('gameMode') || GAME_MODES.CLASSIC;
        gameState.difficulty = localStorage.getItem('difficulty') || DIFFICULTIES.MEDIUM;
        gameState.username = localStorage.getItem('username') || '';
        
        gameState.achievements = JSON.parse(localStorage.getItem('achievements')) || {
            [ACHIEVEMENT_TYPES.SCORE_100]: false,
            [ACHIEVEMENT_TYPES.POWER_UP_5]: false,
            [ACHIEVEMENT_TYPES.SURVIVE_5_MIN]: false
        };
        
        gameState.leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        
        const purchasedColors = JSON.parse(localStorage.getItem('purchasedColors')) || ['green'];
        gameState.snakeColor = localStorage.getItem('currentSnakeColor') || '#0f0';
        
        // Load settings
        const savedSettings = JSON.parse(localStorage.getItem('settings')) || {};
        settings.particleEffects = savedSettings.particleEffects || PARTICLE_LEVELS.MEDIUM;
        settings.soundVolume = savedSettings.soundVolume !== undefined ? savedSettings.soundVolume : 70;
        settings.gridVisibility = savedSettings.gridVisibility !== undefined ? savedSettings.gridVisibility : true;
        settings.crtEffect = savedSettings.crtEffect !== undefined ? savedSettings.crtEffect : true;
        settings.highContrast = savedSettings.highContrast || false;
        
        // Update UI based on loaded settings
        domElements.particleEffects.value = settings.particleEffects;
        domElements.soundVolume.value = settings.soundVolume;
        domElements.gridVisibility.value = settings.gridVisibility ? 'on' : 'off';
        domElements.crtEffect.value = settings.crtEffect ? 'on' : 'off';
        domElements.highContrast.checked = settings.highContrast;
        
        applySettings();
        
        // Update purchased colors in config
        if (config.snakeColors.length > 0) {
            config.snakeColors.forEach(color => {
                color.purchased = purchasedColors.includes(color.name);
            });
        }
        
        // Set username in input
        domElements.usernameInput.value = gameState.username;
        
        // Update UI elements
        updateCoinsDisplay();
        
        // Set active mode and difficulty buttons
        setActiveGameMode(gameState.gameMode);
        setActiveDifficulty(gameState.difficulty);
    } catch (error) {
        console.error('Error loading game data from localStorage:', error);
        
        // Set default values if loading fails
        gameState.highScore = 0;
        gameState.coins = 0;
        gameState.gameMode = GAME_MODES.CLASSIC;
        gameState.difficulty = DIFFICULTIES.MEDIUM;
        gameState.achievements = {
            [ACHIEVEMENT_TYPES.SCORE_100]: false,
            [ACHIEVEMENT_TYPES.POWER_UP_5]: false,
            [ACHIEVEMENT_TYPES.SURVIVE_5_MIN]: false
        };
        gameState.leaderboard = [];
    }
}

// Save game data to localStorage
function saveGameData() {
    try {
        localStorage.setItem('highScore', gameState.highScore);
        localStorage.setItem('coins', gameState.coins);
        localStorage.setItem('gameMode', gameState.gameMode);
        localStorage.setItem('difficulty', gameState.difficulty);
        localStorage.setItem('username', gameState.username);
        localStorage.setItem('achievements', JSON.stringify(gameState.achievements));
        localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
        
        // Save purchased colors
        const purchasedColors = config.snakeColors
            .filter(color => color.purchased)
            .map(color => color.name);
        localStorage.setItem('purchasedColors', JSON.stringify(purchasedColors));
        localStorage.setItem('currentSnakeColor', gameState.snakeColor);
        
        // Save settings
        localStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving game data to localStorage:', error);
    }
}

// Apply settings
function applySettings() {
    // Apply high contrast mode
    if (settings.highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
    
    // Apply CRT effect toggle
    if (settings.crtEffect) {
        domElements.crtEffectElement.style.display = 'block';
        domElements.scanlinesElement.style.display = 'block';
    } else {
        domElements.crtEffectElement.style.display = 'none';
        domElements.scanlinesElement.style.display = 'none';
    }
}

// Update coins display in all UI elements
function updateCoinsDisplay() {
    domElements.mainCoins.textContent = gameState.coins;
    domElements.shopCoins.textContent = gameState.coins;
    domElements.coins.textContent = `Coins: ${gameState.coins}`;
}

// Set active game mode
function setActiveGameMode(mode) {
    // Remove active class from all mode buttons
    domElements.classicMode.classList.remove('active');
    domElements.noWallsMode.classList.remove('active');
    domElements.timeAttackMode.classList.remove('active');
    domElements.mazeMode.classList.remove('active');
    
    // Add active class to selected mode
    switch (mode) {
        case GAME_MODES.CLASSIC:
            domElements.classicMode.classList.add('active');
            break;
        case GAME_MODES.NO_WALLS:
            domElements.noWallsMode.classList.add('active');
            break;
        case GAME_MODES.TIME_ATTACK:
            domElements.timeAttackMode.classList.add('active');
            break;
        case GAME_MODES.MAZE:
            domElements.mazeMode.classList.add('active');
            break;
    }
    
    gameState.gameMode = mode;
    saveGameData();
}

// Set active difficulty
function setActiveDifficulty(difficulty) {
    // Remove active class from all difficulty buttons
    domElements.easyMode.classList.remove('active');
    domElements.mediumMode.classList.remove('active');
    domElements.hardMode.classList.remove('active');
    
    // Add active class to selected difficulty
    switch (difficulty) {
        case DIFFICULTIES.EASY:
            domElements.easyMode.classList.add('active');
            break;
        case DIFFICULTIES.MEDIUM:
            domElements.mediumMode.classList.add('active');
            break;
        case DIFFICULTIES.HARD:
            domElements.hardMode.classList.add('active');
            break;
    }
    
    gameState.difficulty = difficulty;
    saveGameData();
}

// Preload sounds
function preloadSounds() {
    const soundFiles = {
        eat: 'sounds/eat.mp3',
        gameOver: 'sounds/gameOver.mp3',
        powerUp: 'sounds/powerUp.mp3'
    };
    
    for (const [name, path] of Object.entries(soundFiles)) {
        try {
            sounds[name] = new Audio(path);
            sounds[name].load();
        } catch (error) {
            console.error(`Error loading sound: ${name}`, error);
        }
    }
}

// Play sound with volume control
function playSound(sound) {
    if (sounds[sound]) {
        const audio = sounds[sound];
        audio.volume = settings.soundVolume / 100;
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Error playing sound:', e));
    }
}

// Show achievement notification with progress
function showAchievementNotification(message, isCompleted = false) {
    const container = document.getElementById('achievement-container') || createAchievementContainer();
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `${isCompleted ? '🏆 ' : ''}${message}`;
    
    container.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 50);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // Play sound for completed achievements
    if (isCompleted) {
        playSound('powerUp');
    }
}

// Create achievement container if it doesn't exist
function createAchievementContainer() {
    const container = document.createElement('div');
    container.id = 'achievement-container';
    document.getElementById('game-container').appendChild(container);
    return container;
}

// Show message
function showMessage(message, duration) {
    // Clear any existing messages first
    clearMessages();
    
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

// Update achievement progress for visual feedback
function updateAchievementProgress() {
    // Score achievement
    const scoreAchievement = document.getElementById('achievement-score100');
    const scoreProgress = Math.min(gameState.score, ACHIEVEMENT_THRESHOLDS.SCORE) / ACHIEVEMENT_THRESHOLDS.SCORE * 100;
    const scoreBar = scoreAchievement.querySelector('.progress-bar');
    const scoreText = scoreAchievement.querySelector('.progress-text');
    
    scoreBar.style.width = `${scoreProgress}%`;
    scoreBar.setAttribute('data-percentage', scoreProgress);
    scoreText.textContent = `${Math.min(gameState.score, ACHIEVEMENT_THRESHOLDS.SCORE)}/${ACHIEVEMENT_THRESHOLDS.SCORE}`;
    
    if (gameState.achievements[ACHIEVEMENT_TYPES.SCORE_100]) {
        scoreAchievement.classList.add('unlocked');
    }
    
    // Power-up achievement
    const powerUpAchievement = document.getElementById('achievement-powerUp5');
    const powerUpProgress = Math.min(gameState.powerUpCount, ACHIEVEMENT_THRESHOLDS.POWER_UPS) / ACHIEVEMENT_THRESHOLDS.POWER_UPS * 100;
    const powerUpBar = powerUpAchievement.querySelector('.progress-bar');
    const powerUpText = powerUpAchievement.querySelector('.progress-text');
    
    powerUpBar.style.width = `${powerUpProgress}%`;
    powerUpBar.setAttribute('data-percentage', powerUpProgress);
    powerUpText.textContent = `${Math.min(gameState.powerUpCount, ACHIEVEMENT_THRESHOLDS.POWER_UPS)}/${ACHIEVEMENT_THRESHOLDS.POWER_UPS}`;
    
    if (gameState.achievements[ACHIEVEMENT_TYPES.POWER_UP_5]) {
        powerUpAchievement.classList.add('unlocked');
    }
    
    // Survival achievement
    const surviveAchievement = document.getElementById('achievement-survive5Min');
    
    if (gameState.state === GAME_STATES.PLAYING) {
        const survivalTime = Math.min(Date.now() - gameState.gameStartTime, ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME);
        const survivalProgress = survivalTime / ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME * 100;
        const survivalBar = surviveAchievement.querySelector('.progress-bar');
        const survivalText = surviveAchievement.querySelector('.progress-text');
        
        survivalBar.style.width = `${survivalProgress}%`;
        survivalBar.setAttribute('data-percentage', survivalProgress);
        survivalText.textContent = `${Math.floor(survivalTime / 1000)}/${ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME / 1000}`;
    }
    
    if (gameState.achievements[ACHIEVEMENT_TYPES.SURVIVE_5_MIN]) {
        surviveAchievement.classList.add('unlocked');
    }
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    domElements.leaderboardList.innerHTML = '';
    
    if (gameState.leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No scores yet';
        domElements.leaderboardList.appendChild(li);
        return;
    }
    
    gameState.leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        
        // Check if entry is an object with name and score
        if (typeof entry === 'object' && entry.name && entry.score !== undefined) {
            li.textContent = `#${index + 1}: ${entry.name} - ${entry.score}`;
        } else {
            // Backward compatibility with older leaderboard format (just score)
            li.textContent = `#${index + 1}: ${gameState.username || 'Player'} - ${entry}`;
        }
        
        domElements.leaderboardList.appendChild(li);
    });
}

// Initialize game canvas
function initCanvas() {
    const width = config.gridSize * config.cellSize;
    const height = config.gridSize * config.cellSize;
    
    domElements.gameCanvas.width = width;
    domElements.gameCanvas.height = height;
    domElements.gameCanvas.style.width = `${width}px`;
    domElements.gameCanvas.style.height = `${height}px`;
}

// Setup game based on selected mode
function setupGame() {
    // Reset game state
    gameState.snake = [{ x: Math.floor(config.gridSize / 2), y: Math.floor(config.gridSize / 2) }];
    gameState.direction = { ...DIRECTIONS.RIGHT };
    gameState.nextDirection = { ...DIRECTIONS.RIGHT };
    gameState.score = 0;
    gameState.scoreMultiplier = 1;
    gameState.powerUpActive = null;
    gameState.powerUpTimer = null;
    gameState.powerUpCount = 0;
    gameState.gameStartTime = Date.now();
    gameState.isInvincible = false;
    gameState.particles = [];
    
    // Setup speed based on difficulty
    speed = config.difficulties[gameState.difficulty].speed;
    
    // Clear existing obstacles
    gameState.obstacles = [];
    
    // Setup for specific game modes
    switch (gameState.gameMode) {
        case GAME_MODES.MAZE:
            generateMaze();
            break;
        case GAME_MODES.TIME_ATTACK:
            gameState.timeLeft = TIME_ATTACK_DURATION;
            domElements.timer.style.display = 'block';
            updateTimer();
            timeAttackInterval = setInterval(updateTimer, 1000);
            break;
        default:
            domElements.timer.style.display = 'none';
            if (timeAttackInterval) {
                clearInterval(timeAttackInterval);
                timeAttackInterval = null;
            }
    }
    
    // Generate initial food
    generateFood();
    
    // Clear any existing power-ups
    gameState.powerUp = null;
    
    // Set starting animation state
    animationState.animating = false;
    
    // Update UI
    domElements.score.textContent = gameState.score;
    domElements.highScore.textContent = gameState.highScore;
    
    // Start counting achieved achievements
    updateAchievementsCount();
}

// Generate maze obstacles
function generateMaze() {
    const obstacleCount = Math.floor(config.gridSize * config.gridSize * 0.1); // 10% of grid as obstacles
    gameState.obstacles = [];
    
    // Place obstacles randomly, ensuring they don't block the snake
    for (let i = 0; i < obstacleCount; i++) {
        let position;
        let validPosition = false;
        
        // Keep trying until we find a valid position
        while (!validPosition) {
            position = {
                x: Math.floor(Math.random() * config.gridSize),
                y: Math.floor(Math.random() * config.gridSize)
            };
            
            // Check if position overlaps with snake or existing obstacles or food
            const overlapsWithSnake = gameState.snake.some(segment => 
                segment.x === position.x && segment.y === position.y);
            
            const overlapsWithObstacles = gameState.obstacles.some(obstacle => 
                obstacle.x === position.x && obstacle.y === position.y);
            
            const isTooCloseToSnakeHead = 
                Math.abs(position.x - gameState.snake[0].x) < 3 && 
                Math.abs(position.y - gameState.snake[0].y) < 3;
            
            const overlapsWithFood = 
                gameState.food && gameState.food.x === position.x && gameState.food.y === position.y;
            
            if (!overlapsWithSnake && !overlapsWithObstacles && !isTooCloseToSnakeHead && !overlapsWithFood) {
                validPosition = true;
            }
        }
        
        gameState.obstacles.push(position);
    }
}

// Generate food at random position
function generateFood() {
    let position;
    let validPosition = false;
    
    // Determine food type based on probability
    const rand = Math.random();
    let foodType = FOOD_TYPES.REGULAR;
    
    if (rand > 0.9) {
        foodType = FOOD_TYPES.SPECIAL;
    } else if (rand > 0.7) {
        foodType = FOOD_TYPES.BONUS;
    }
    
    // Keep trying until we find a valid position
    while (!validPosition) {
        position = {
            x: Math.floor(Math.random() * config.gridSize),
            y: Math.floor(Math.random() * config.gridSize),
            type: foodType
        };
        
        // Check if position overlaps with snake, obstacles, or existing power-up
        const overlapsWithSnake = gameState.snake.some(segment => 
            segment.x === position.x && segment.y === position.y);
        
        const overlapsWithObstacles = gameState.obstacles && gameState.obstacles.some(obstacle => 
            obstacle.x === position.x && obstacle.y === position.y);
        
        const overlapsWithPowerUp = gameState.powerUp && 
            gameState.powerUp.x === position.x && gameState.powerUp.y === position.y;
        
        if (!overlapsWithSnake && !overlapsWithObstacles && !overlapsWithPowerUp) {
            validPosition = true;
        }
    }
    
    gameState.food = position;
}

// Generate power-up at random position
function generatePowerUp() {
    if (Math.random() > POWER_UP_CHANCE) {
        return; // Don't always generate a power-up
    }
    
    let position;
    let validPosition = false;
    
    // Determine power-up type randomly
    const powerUpTypes = Object.values(POWER_UP_TYPES);
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Keep trying until we find a valid position
    while (!validPosition) {
        position = {
            x: Math.floor(Math.random() * config.gridSize),
            y: Math.floor(Math.random() * config.gridSize),
            type: randomType
        };
        
        // Check if position overlaps with snake, obstacles, or food
        const overlapsWithSnake = gameState.snake.some(segment => 
            segment.x === position.x && segment.y === position.y);
        
        const overlapsWithObstacles = gameState.obstacles && gameState.obstacles.some(obstacle => 
            obstacle.x === position.x && obstacle.y === position.y);
        
        const overlapsWithFood = gameState.food && 
            gameState.food.x === position.x && gameState.food.y === position.y;
        
        if (!overlapsWithSnake && !overlapsWithObstacles && !overlapsWithFood) {
            validPosition = true;
        }
    }
    
    gameState.powerUp = position;
}

// Apply power-up effect
function applyPowerUp(type) {
    // Clear any existing power-up timer
    if (gameState.powerUpTimer) {
        clearTimeout(gameState.powerUpTimer);
    }
    
    // Apply effect based on type
    switch (type) {
        case POWER_UP_TYPES.SPEED:
            speed = Math.max(speed * 0.7, 30); // Increase speed (lower ms delay)
            showMessage('Speed Boost!', 2000);
            break;
        case POWER_UP_TYPES.SLOW:
            speed = speed * 1.5; // Decrease speed (higher ms delay)
            showMessage('Slowed Down!', 2000);
            break;
        case POWER_UP_TYPES.INVINCIBLE:
            gameState.isInvincible = true;
            showMessage('Invincible!', 2000);
            break;
        case POWER_UP_TYPES.SCORE_MULTIPLIER:
            gameState.scoreMultiplier = 2;
            showMessage('2x Score!', 2000);
            break;
        case POWER_UP_TYPES.SHRINK:
            // Remove up to 3 tail segments, but keep at least 1
            const segmentsToRemove = Math.min(3, gameState.snake.length - 1);
            if (segmentsToRemove > 0) {
                gameState.snake.splice(gameState.snake.length - segmentsToRemove, segmentsToRemove);
                showMessage('Snake Shrank!', 2000);
            }
            break;
    }
    
    // Track active power-up
    gameState.powerUpActive = type;
    
    // Set timer to reset power-up
    gameState.powerUpTimer = setTimeout(() => {
        resetPowerUp();
    }, POWER_UP_DURATION);
    
    // Increment power-up count for achievement tracking
    gameState.powerUpCount++;
    
    // Check for power-up achievement
    if (gameState.powerUpCount >= ACHIEVEMENT_THRESHOLDS.POWER_UPS && !gameState.achievements[ACHIEVEMENT_TYPES.POWER_UP_5]) {
        unlockAchievement(ACHIEVEMENT_TYPES.POWER_UP_5);
    }
}

// Reset active power-up effect
function resetPowerUp() {
    // Reset speed to difficulty-based speed
    speed = config.difficulties[gameState.difficulty].speed;
    
    // Reset other power-up effects
    gameState.isInvincible = false;
    gameState.scoreMultiplier = 1;
    
    // Clear active power-up
    gameState.powerUpActive = null;
    gameState.powerUpTimer = null;
}

// Update timer for Time Attack mode
function updateTimer() {
    if (gameState.state !== GAME_STATES.PLAYING) return;
    
    gameState.timeLeft--;
    
    // Update timer display
    domElements.timer.textContent = `Time: ${gameState.timeLeft}`;
    
    // End game if time runs out
    if (gameState.timeLeft <= 0) {
        gameOver();
    }
}

// Add particle effect
function addParticles(x, y, count, color, type = 'circle') {
    if (settings.particleEffects === PARTICLE_LEVELS.OFF) return;
    
    // Scale particle count based on settings
    const actualCount = PARTICLE_COUNTS[settings.particleEffects];
    
    for (let i = 0; i < actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        gameState.particles.push({
            x: x * config.cellSize + config.cellSize / 2,
            y: y * config.cellSize + config.cellSize / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: color,
            life: 30,
            type: type
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Apply gravity
        particle.vy += 0.1;
        
        // Reduce size and life
        particle.size *= 0.95;
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0 || particle.size < 0.5) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    if (settings.particleEffects === PARTICLE_LEVELS.OFF) return;
    
    ctx.save();
    
    for (const particle of gameState.particles) {
        ctx.globalAlpha = particle.life / 30;
        ctx.fillStyle = particle.color;
        
        if (particle.type === 'circle') {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (particle.type === 'square') {
            ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }
    }
    
    ctx.restore();
}

// Check if the snake hit a wall
function checkWallCollision(head) {
    // In no-walls mode, snake wraps around
    if (gameState.gameMode === GAME_MODES.NO_WALLS) {
        if (head.x < 0) head.x = config.gridSize - 1;
        if (head.x >= config.gridSize) head.x = 0;
        if (head.y < 0) head.y = config.gridSize - 1;
        if (head.y >= config.gridSize) head.y = 0;
        return false;
    }
    
    // In other modes, hitting walls is game over
    return (
        head.x < 0 ||
        head.x >= config.gridSize ||
        head.y < 0 ||
        head.y >= config.gridSize
    );
}

// Check if the snake hit itself
function checkSelfCollision(head) {
    // Skip first segment (head)
    return gameState.snake.slice(1).some(segment => 
        segment.x === head.x && segment.y === head.y
    );
}

// Check if the snake hit an obstacle
function checkObstacleCollision(head) {
    return gameState.obstacles.some(obstacle => 
        obstacle.x === head.x && obstacle.y === head.y
    );
}

// Update achievements count
function updateAchievementsCount() {
    const count = Object.values(gameState.achievements).filter(Boolean).length;
    domElements.achievementsCount.textContent = count;
}

// Unlock achievement
function unlockAchievement(type) {
    // Skip if already unlocked
    if (gameState.achievements[type]) return;
    
    // Unlock the achievement
    gameState.achievements[type] = true;
    
    // Save game data
    saveGameData();
    
    // Show notification
    let message;
    switch (type) {
        case ACHIEVEMENT_TYPES.SCORE_100:
            message = 'Achievement: Score 100 points';
            break;
        case ACHIEVEMENT_TYPES.POWER_UP_5:
            message = 'Achievement: Collect 5 power-ups';
            break;
        case ACHIEVEMENT_TYPES.SURVIVE_5_MIN:
            message = 'Achievement: Survive for 5 minutes';
            break;
    }
    
    showAchievementNotification(message, true);
    
    // Update achievements count
    updateAchievementsCount();
    
    // Award coins for achievement
    gameState.coins += 50;
    updateCoinsDisplay();
}

// Check achievements
function checkAchievements() {
    // Score achievement
    if (gameState.score >= ACHIEVEMENT_THRESHOLDS.SCORE && !gameState.achievements[ACHIEVEMENT_TYPES.SCORE_100]) {
        unlockAchievement(ACHIEVEMENT_TYPES.SCORE_100);
    }
    
    // Power-up achievement checked in applyPowerUp function
    
    // Survival time achievement
    const survivalTime = Date.now() - gameState.gameStartTime;
    if (survivalTime >= ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME && !gameState.achievements[ACHIEVEMENT_TYPES.SURVIVE_5_MIN]) {
        unlockAchievement(ACHIEVEMENT_TYPES.SURVIVE_5_MIN);
    }
}

// Add score to leaderboard
function addToLeaderboard() {
    if (!gameState.username) {
        gameState.username = 'Player';
    }
    
    const entry = {
        name: gameState.username,
        score: gameState.score,
        date: new Date().toISOString()
    };
    
    gameState.leaderboard.push(entry);
    
    // Sort by score (highest first)
    gameState.leaderboard.sort((a, b) => {
        // Handle old format (just scores)
        const scoreA = typeof a === 'object' ? a.score : a;
        const scoreB = typeof b === 'object' ? b.score : b;
        
        return scoreB - scoreA;
    });
    
    // Keep only top scores
    if (gameState.leaderboard.length > LEADERBOARD_MAX_SIZE) {
        gameState.leaderboard = gameState.leaderboard.slice(0, LEADERBOARD_MAX_SIZE);
    }
    
    // Save leaderboard
    saveGameData();
    
    // Update leaderboard display
    updateLeaderboardDisplay();
}

// Game over function
function gameOver() {
    gameState.state = GAME_STATES.GAMEOVER;
    
    // Play game over sound
    playSound('gameOver');
    
    // Clear any active power-up timer
    if (gameState.powerUpTimer) {
        clearTimeout(gameState.powerUpTimer);
        gameState.powerUpTimer = null;
    }
    
    // Clear time attack timer
    if (timeAttackInterval) {
        clearInterval(timeAttackInterval);
        timeAttackInterval = null;
    }
    
    // Update high score if necessary
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        domElements.highScore.textContent = gameState.highScore;
    }
    
    // Award coins based on score
    const coinsEarned = Math.floor(gameState.score / 10);
    gameState.coins += coinsEarned;
    updateCoinsDisplay();
    
    // Save game data
    saveGameData();
    
    // Add to leaderboard
    addToLeaderboard();
    
    // Show game over screen
    domElements.gameOverScreen.style.display = 'flex';
    domElements.finalScore.textContent = gameState.score;
    domElements.highScoreDisplay.textContent = gameState.highScore;
}

// Game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const delta = timestamp - lastUpdateTime;
    
    // Update if enough time has passed
    if (delta >= speed) {
        update();
        lastUpdateTime = timestamp;
    }
    
    // Draw game
    draw(timestamp);
    
    // Request next frame if game is still running
    if (gameState.state === GAME_STATES.PLAYING) {
        animationFrame = requestAnimationFrame(gameLoop);
    }
}

// Main game update function
function update() {
    if (gameState.state !== GAME_STATES.PLAYING) return;
    
    // Check for achievements
    checkAchievements();
    
    // Update particles
    updateParticles();
    
    // Don't update snake movement if animating
    if (animationState.animating) return;
    
    // Get current head position
    const head = { ...gameState.snake[0] };
    
    // Update direction from next direction
    gameState.direction = { ...gameState.nextDirection };
    
    // Calculate new head position
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y
    };
    
    // Check for wall collision
    if (checkWallCollision(newHead)) {
        if (!gameState.isInvincible) {
            gameOver();
            return;
        } else {
            // If invincible in classic mode, wrap around
            if (newHead.x < 0) newHead.x = config.gridSize - 1;
            if (newHead.x >= config.gridSize) newHead.x = 0;
            if (newHead.y < 0) newHead.y = config.gridSize - 1;
            if (newHead.y >= config.gridSize) newHead.y = 0;
        }
    }
    
    // Check for obstacle collision
    if (checkObstacleCollision(newHead) && !gameState.isInvincible) {
        gameOver();
        return;
    }
    
    // Check for self collision
    if (checkSelfCollision(newHead) && !gameState.isInvincible) {
        gameOver();
        return;
    }
    
    // Setup for animation
    animationState.animating = true;
    animationState.startTime = performance.now();
    animationState.startPositions = gameState.snake.map(segment => ({ ...segment }));
    
    // Add new head to snake
    gameState.snake.unshift(newHead);
    
    // Check if snake ate food
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        // Play eat sound
        playSound('eat');
        
        // Add particles
        let foodColor;
        switch (gameState.food.type) {
            case FOOD_TYPES.BONUS:
                foodColor = config.colors.bonus;
                break;
            case FOOD_TYPES.SPECIAL:
                foodColor = config.colors.special;
                break;
            default:
                foodColor = config.colors.food;
        }
        
        addParticles(newHead.x, newHead.y, 10, foodColor);
        
        // Update score based on food type
        let points = 1;
        switch (gameState.food.type) {
            case FOOD_TYPES.BONUS:
                points = 5;
                break;
            case FOOD_TYPES.SPECIAL:
                points = 10;
                break;
        }
        
        // Apply score multiplier from power-up
        points *= gameState.scoreMultiplier;
        
        // Update score
        gameState.score += points;
        domElements.score.textContent = gameState.score;
        
        // Check for score achievement
        if (gameState.score >= ACHIEVEMENT_THRESHOLDS.SCORE && !gameState.achievements[ACHIEVEMENT_TYPES.SCORE_100]) {
            unlockAchievement(ACHIEVEMENT_TYPES.SCORE_100);
        }
        
        // Generate new food
        generateFood();
        
        // Possibly generate power-up (10% chance after eating)
        if (!gameState.powerUp && Math.random() < 0.1) {
            generatePowerUp();
        }
        
        // Don't remove tail if food was eaten
    } else {
        // Remove tail segment if no food was eaten
        gameState.snake.pop();
    }
    
    // Check if snake ate power-up
    if (gameState.powerUp && newHead.x === gameState.powerUp.x && newHead.y === gameState.powerUp.y) {
        // Play power-up sound
        playSound('powerUp');
        
        // Add particles
        const powerUpColor = config.colors.powerUps[gameState.powerUp.type] || '#ffffff';
        addParticles(newHead.x, newHead.y, 15, powerUpColor, 'square');
        
        // Apply power-up effect
        applyPowerUp(gameState.powerUp.type);
        
        // Clear power-up
        gameState.powerUp = null;
    }
    
    // Setup target positions for animation
    animationState.targetPositions = gameState.snake.map(segment => ({ ...segment }));
    
    // Progressive difficulty: increase speed slightly every 5 points
    if (gameState.score > 0 && gameState.score % 5 === 0 && gameState.scoreAtLastSpeedIncrease !== gameState.score) {
        gameState.scoreAtLastSpeedIncrease = gameState.score;
        // Only decrease if no power-up is active
        if (!gameState.powerUpActive) {
            speed = Math.max(speed * 0.95, 40); // Don't go too fast
        }
    }
}

// Draw current game state
function draw(timestamp) {
    // Clear canvas
    ctx.clearRect(0, 0, domElements.gameCanvas.width, domElements.gameCanvas.height);
    
    // Draw background
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, domElements.gameCanvas.width, domElements.gameCanvas.height);
    
    // Draw grid if visible
    if (settings.gridVisibility) {
        drawGrid();
    }
    
    // Draw obstacles
    drawObstacles();
    
    // Draw food
    drawFood();
    
    // Draw power-up
    if (gameState.powerUp) {
        drawPowerUp();
    }
    
    // Draw snake
    drawSnake(timestamp);
    
    // Draw particles
    drawParticles();
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= config.gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * config.cellSize, 0);
        ctx.lineTo(x * config.cellSize, config.gridSize * config.cellSize);
        ctx.stroke();
    }
    
    for (let y = 0; y <= config.gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * config.cellSize);
        ctx.lineTo(config.gridSize * config.cellSize, y * config.cellSize);
        ctx.stroke();
    }
}

// Draw obstacles
function drawObstacles() {
    ctx.fillStyle = config.colors.obstacle;
    
    for (const obstacle of gameState.obstacles) {
        ctx.fillRect(
            obstacle.x * config.cellSize,
            obstacle.y * config.cellSize,
            config.cellSize,
            config.cellSize
        );
    }
}

// Draw food
function drawFood() {
    let foodColor;
    
    // Set color based on food type
    switch (gameState.food.type) {
        case FOOD_TYPES.BONUS:
            foodColor = config.colors.bonus;
            break;
        case FOOD_TYPES.SPECIAL:
            foodColor = config.colors.special;
            break;
        default:
            foodColor = config.colors.food;
    }
    
    ctx.fillStyle = foodColor;
    
    // Make food pulsate slightly
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
    const size = config.cellSize * 0.8 * pulse;
    const offset = (config.cellSize - size) / 2;
    
    ctx.beginPath();
    ctx.arc(
        gameState.food.x * config.cellSize + config.cellSize / 2,
        gameState.food.y * config.cellSize + config.cellSize / 2,
        size / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Draw power-up
function drawPowerUp() {
    // Set color based on power-up type
    const powerUpColor = config.colors.powerUps[gameState.powerUp.type] || '#ffffff';
    ctx.fillStyle = powerUpColor;
    
    // Make power-up pulsate
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
    const size = config.cellSize * 0.7 * pulse;
    const offset = (config.cellSize - size) / 2;
    
    // Draw as a square with rounded corners
    ctx.beginPath();
    ctx.roundRect(
        gameState.powerUp.x * config.cellSize + offset,
        gameState.powerUp.y * config.cellSize + offset,
        size,
        size,
        5
    );
    ctx.fill();
    
    // Draw a symbol or letter based on the power-up type
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let symbol;
    switch (gameState.powerUp.type) {
        case POWER_UP_TYPES.SPEED:
            symbol = '⚡';
            break;
        case POWER_UP_TYPES.SLOW:
            symbol = '🐢';
            break;
        case POWER_UP_TYPES.INVINCIBLE:
            symbol = '⭐';
            break;
        case POWER_UP_TYPES.SCORE_MULTIPLIER:
            symbol = '2x';
            break;
        case POWER_UP_TYPES.SHRINK:
            symbol = '↓';
            break;
        default:
            symbol = '?';
    }
    
    ctx.fillText(
        symbol,
        gameState.powerUp.x * config.cellSize + config.cellSize / 2,
        gameState.powerUp.y * config.cellSize + config.cellSize / 2
    );
}

// Draw snake with smooth animation
function drawSnake(timestamp) {
    // Handle animation if active
    let positions;
    
    if (animationState.animating) {
        // Calculate animation progress
        const elapsed = timestamp - animationState.startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Interpolate positions for smooth movement
        positions = animationState.startPositions.map((start, index) => {
            // Check if there's a target position for this segment
            if (index < animationState.targetPositions.length) {
                const target = animationState.targetPositions[index];
                
                return {
                    x: start.x + (target.x - start.x) * progress,
                    y: start.y + (target.y - start.y) * progress
                };
            }
            
            // If no target (when growing), just use start position
            return { ...start };
        });
        
        // End animation when complete
        if (progress >= 1) {
            animationState.animating = false;
        }
    } else {
        // Use current positions if not animating
        positions = gameState.snake.map(segment => ({ ...segment }));
    }
    
    // Draw segments
    for (let i = positions.length - 1; i >= 0; i--) {
        const segment = positions[i];
        
        // Determine segment color
        let segmentColor;
        
        if (i === 0) {
            // Head
            segmentColor = config.colors.head;
        } else {
            // Body
            segmentColor = gameState.isInvincible 
                ? `hsl(${(Date.now() / 10 + i * 5) % 360}, 100%, 50%)` // Rainbow effect for invincibility
                : gameState.snakeColor;
        }
        
        // Draw rounded segment
        ctx.fillStyle = segmentColor;
        
        const x = segment.x * config.cellSize;
        const y = segment.y * config.cellSize;
        const size = config.cellSize * 0.9; // Slightly smaller than cell for rounded effect
        const radius = size / 4; // Rounded corners
        
        ctx.beginPath();
        ctx.roundRect(
            x + (config.cellSize - size) / 2,
            y + (config.cellSize - size) / 2,
            size,
            size,
            radius
        );
        ctx.fill();
        
        // Add a small highlight for 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(
            x + config.cellSize * 0.3,
            y + config.cellSize * 0.3,
            config.cellSize * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw eyes on head if not animating or near end of animation
    if (!animationState.animating || (timestamp - animationState.startTime) > ANIMATION_DURATION * 0.7) {
        const head = positions[0];
        
        ctx.fillStyle = 'white';
        
        // Determine eye positions based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        if (gameState.direction.x === 0 && gameState.direction.y === -1) {
            // Up
            leftEyeX = head.x * config.cellSize + config.cellSize * 0.3;
            leftEyeY = head.y * config.cellSize + config.cellSize * 0.3;
            rightEyeX = head.x * config.cellSize + config.cellSize * 0.7;
            rightEyeY = head.y * config.cellSize + config.cellSize * 0.3;
        } else if (gameState.direction.x === 0 && gameState.direction.y === 1) {
            // Down
            leftEyeX = head.x * config.cellSize + config.cellSize * 0.3;
            leftEyeY = head.y * config.cellSize + config.cellSize * 0.7;
            rightEyeX = head.x * config.cellSize + config.cellSize * 0.7;
            rightEyeY = head.y * config.cellSize + config.cellSize * 0.7;
        } else if (gameState.direction.x === -1 && gameState.direction.y === 0) {
            // Left
            leftEyeX = head.x * config.cellSize + config.cellSize * 0.3;
            leftEyeY = head.y * config.cellSize + config.cellSize * 0.3;
            rightEyeX = head.x * config.cellSize + config.cellSize * 0.3;
            rightEyeY = head.y * config.cellSize + config.cellSize * 0.7;
        } else {
            // Right
            leftEyeX = head.x * config.cellSize + config.cellSize * 0.7;
            leftEyeY = head.y * config.cellSize + config.cellSize * 0.3;
            rightEyeX = head.x * config.cellSize + config.cellSize * 0.7;
            rightEyeY = head.y * config.cellSize + config.cellSize * 0.7;
        }
        
        // Draw eyes
        const eyeSize = config.cellSize * 0.15;
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Handle keyboard input
function handleKeydown(event) {
    // Ignore if game is not in playing state
    if (gameState.state !== GAME_STATES.PLAYING) return;
    
    // Prevent defaults for arrow keys and WASD to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault();
    }
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            // Don't allow reversing direction
            if (gameState.direction.y !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.UP };
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (gameState.direction.y !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.DOWN };
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (gameState.direction.x !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.LEFT };
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (gameState.direction.x !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.RIGHT };
            }
            break;
        case 'p':
        case 'P':
        case 'Escape':
            // Toggle pause
            togglePause();
            break;
    }
}

// Handle touch input for swipes
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(event) {
    // Prevent default behavior to avoid scrolling
    event.preventDefault();
    
    // Store starting touch point
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    // Prevent default behavior to avoid scrolling
    event.preventDefault();
    
    // Store ending touch point
    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;
}

function handleTouchEnd() {
    // Ignore if game is not in playing state
    if (gameState.state !== GAME_STATES.PLAYING) return;
    
    // Calculate swipe distance
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Ignore if swipe distance is too small
    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) return;
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            // Swipe right
            if (gameState.direction.x !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.RIGHT };
            }
        } else {
            // Swipe left
            if (gameState.direction.x !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.LEFT };
            }
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            // Swipe down
            if (gameState.direction.y !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.DOWN };
            }
        } else {
            // Swipe up
            if (gameState.direction.y !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.UP };
            }
        }
    }
}

// Handle click on mobile direction buttons
function handleMobileButtonClick(direction) {
    // Ignore if game is not in playing state
    if (gameState.state !== GAME_STATES.PLAYING) return;
    
    switch (direction) {
        case 'up':
            if (gameState.direction.y !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.UP };
            }
            break;
        case 'down':
            if (gameState.direction.y !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.DOWN };
            }
            break;
        case 'left':
            if (gameState.direction.x !== 1) {
                gameState.nextDirection = { ...DIRECTIONS.LEFT };
            }
            break;
        case 'right':
            if (gameState.direction.x !== -1) {
                gameState.nextDirection = { ...DIRECTIONS.RIGHT };
            }
            break;
    }
}

// Toggle pause state
function togglePause() {
    if (gameState.state === GAME_STATES.PLAYING) {
        // Pause game
        gameState.state = GAME_STATES.PAUSED;
        
        // Cancel animation frame
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        // Show pause menu
        domElements.pauseMenu.style.display = 'flex';
    } else if (gameState.state === GAME_STATES.PAUSED) {
        // Resume game
        resumeGame();
    }
}

// Resume game from pause
function resumeGame() {
    if (gameState.state === GAME_STATES.PAUSED) {
        // Hide pause menu
        domElements.pauseMenu.style.display = 'none';
        
        // Set state to playing
        gameState.state = GAME_STATES.PLAYING;
        
        // Reset last update time
        lastUpdateTime = performance.now();
        
        // Start game loop
        animationFrame = requestAnimationFrame(gameLoop);
    }
}

// Start game with current settings
function startGame() {
    // Save username if provided
    if (domElements.usernameInput.value.trim() !== '') {
        gameState.username = domElements.usernameInput.value.trim();
        saveGameData();
    }
    
    // Hide main menu, game over screen, and other UI elements
    domElements.mainMenu.style.display = 'none';
    domElements.gameOverScreen.style.display = 'none';
    domElements.leaderboard.style.display = 'none';
    domElements.snakeShop.style.display = 'none';
    domElements.settingsMenu.style.display = 'none';
    domElements.achievementsScreen.style.display = 'none';
    
    // Show game UI
    domElements.ui.style.display = 'flex';
    
    // Show mobile controls on small screens
    if (window.innerWidth < 768) {
        domElements.mobileControls.style.display = 'flex';
    } else {
        domElements.mobileControls.style.display = 'none';
    }
    
    // Set game state to playing
    gameState.state = GAME_STATES.PLAYING;
    
    // Setup game based on current settings
    setupGame();
    
    // Focus on game canvas
    domElements.gameCanvas.focus();
    
    // Start game loop
    lastUpdateTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
}

// Restart game after game over
function restartGame() {
    // Hide game over screen
    domElements.gameOverScreen.style.display = 'none';
    
    // Start game
    startGame();
}

// Navigate to main menu
function goToMainMenu() {
    // Hide all other UI elements
    domElements.gameOverScreen.style.display = 'none';
    domElements.pauseMenu.style.display = 'none';
    domElements.leaderboard.style.display = 'none';
    domElements.snakeShop.style.display = 'none';
    domElements.settingsMenu.style.display = 'none';
    domElements.achievementsScreen.style.display = 'none';
    domElements.ui.style.display = 'none';
    domElements.mobileControls.style.display = 'none';
    
    // Update main menu UI
    updateCoinsDisplay();
    
    // Show main menu
    domElements.mainMenu.style.display = 'flex';
    
    // Set game state to menu
    gameState.state = GAME_STATES.MENU;
    
    // Cancel any existing animation frame
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

// Show leaderboard
function showLeaderboard() {
    // Hide game over screen if shown
    domElements.gameOverScreen.style.display = 'none';
    
    // Update leaderboard
    updateLeaderboardDisplay();
    
    // Show leaderboard
    domElements.leaderboard.style.display = 'flex';
}

// Show snake shop
function showShop() {
    // Hide main menu
    domElements.mainMenu.style.display = 'none';
    
    // Update shop UI with available colors
    updateShopUI();
    
    // Show shop
    domElements.snakeShop.style.display = 'flex';
}

// Show settings menu
function showSettings() {
    // Hide related menus
    domElements.mainMenu.style.display = 'none';
    domElements.pauseMenu.style.display = 'none';
    
    // Show settings
    domElements.settingsMenu.style.display = 'flex';
}

// Show achievements screen
function showAchievements() {
    // Hide main menu
    domElements.mainMenu.style.display = 'none';
    
    // Update achievements display
    updateAchievementsDisplay();
    
    // Show achievements
    domElements.achievementsScreen.style.display = 'flex';
}

// Update shop UI with available snake colors
function updateShopUI() {
    domElements.shopItems.innerHTML = '';
    
    config.snakeColors.forEach(color => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        
        // Add color preview
        const preview = document.createElement('div');
        preview.className = 'color-preview';
        preview.style.backgroundColor = color.value;
        
        // Add name and price
        const info = document.createElement('div');
        info.className = 'shop-item-info';
        
        const name = document.createElement('span');
        name.textContent = color.name;
        
        // Add button to purchase or select
        const button = document.createElement('button');
        
        if (color.purchased) {
            // Color is already purchased, allow selecting
            if (gameState.snakeColor === color.value) {
                button.textContent = 'Selected';
                button.disabled = true;
                item.classList.add('selected');
            } else {
                button.textContent = 'Select';
                button.addEventListener('click', () => {
                    selectSnakeColor(color.value);
                    updateShopUI();
                });
            }
        } else {
            // Not purchased, show price
            button.textContent = `Buy for ${color.price} coins`;
            button.addEventListener('click', () => {
                purchaseSnakeColor(color);
                updateShopUI();
            });
            
            // Disable if not enough coins
            if (gameState.coins < color.price) {
                button.disabled = true;
                button.textContent += ' (Not enough coins)';
            }
        }
        
        // Assemble item
        info.appendChild(name);
        info.appendChild(document.createElement('br'));
        info.appendChild(button);
        
        item.appendChild(preview);
        item.appendChild(info);
        
        domElements.shopItems.appendChild(item);
    });
}

// Purchase snake color
function purchaseSnakeColor(color) {
    // Check if enough coins
    if (gameState.coins >= color.price) {
        // Deduct coins
        gameState.coins -= color.price;
        updateCoinsDisplay();
        
        // Mark as purchased
        color.purchased = true;
        
        // Select this color
        selectSnakeColor(color.value);
        
        // Save game data
        saveGameData();
        
        // Show success message
        showMessage(`Purchased ${color.name} snake color!`, 2000);
    } else {
        // Show error message
        showMessage('Not enough coins!', 2000);
    }
}

// Select snake color
function selectSnakeColor(colorValue) {
    gameState.snakeColor = colorValue;
    saveGameData();
    showMessage('Snake color selected!', 1000);
}

// Update achievements display
function updateAchievementsDisplay() {
    // Clear existing achievements
    domElements.achievementsList.innerHTML = '';
    
    // Add achievement: score 100
    const score100 = createAchievementItem(
        'Score 100 points',
        gameState.achievements[ACHIEVEMENT_TYPES.SCORE_100],
        Math.min(gameState.score, ACHIEVEMENT_THRESHOLDS.SCORE) / ACHIEVEMENT_THRESHOLDS.SCORE * 100,
        `${Math.min(gameState.score, ACHIEVEMENT_THRESHOLDS.SCORE)}/${ACHIEVEMENT_THRESHOLDS.SCORE}`,
        'achievement-score100'
    );
    domElements.achievementsList.appendChild(score100);
    
    // Add achievement: collect 5 power-ups
    const powerUp5 = createAchievementItem(
        'Collect 5 power-ups',
        gameState.achievements[ACHIEVEMENT_TYPES.POWER_UP_5],
        Math.min(gameState.powerUpCount, ACHIEVEMENT_THRESHOLDS.POWER_UPS) / ACHIEVEMENT_THRESHOLDS.POWER_UPS * 100,
        `${Math.min(gameState.powerUpCount, ACHIEVEMENT_THRESHOLDS.POWER_UPS)}/${ACHIEVEMENT_THRESHOLDS.POWER_UPS}`,
        'achievement-powerUp5'
    );
    domElements.achievementsList.appendChild(powerUp5);
    
    // Add achievement: survive 5 minutes
    let survivalProgress = 0;
    let survivalText = '0/300';
    
    if (gameState.state === GAME_STATES.PLAYING) {
        const survivalTime = Math.min(Date.now() - gameState.gameStartTime, ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME);
        survivalProgress = survivalTime / ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME * 100;
        survivalText = `${Math.floor(survivalTime / 1000)}/${ACHIEVEMENT_THRESHOLDS.SURVIVAL_TIME / 1000}`;
    }
    
    const survive5Min = createAchievementItem(
        'Survive for 5 minutes',
        gameState.achievements[ACHIEVEMENT_TYPES.SURVIVE_5_MIN],
        survivalProgress,
        survivalText,
        'achievement-survive5Min'
    );
    domElements.achievementsList.appendChild(survive5Min);
}

// Create achievement item
function createAchievementItem(title, unlocked, progress, progressText, id) {
    const item = document.createElement('div');
    item.className = 'achievement-item';
    item.id = id;
    
    if (unlocked) {
        item.classList.add('unlocked');
    }
    
    const icon = document.createElement('div');
    icon.className = 'achievement-icon';
    icon.innerHTML = unlocked ? '🏆' : '🔒';
    
    const info = document.createElement('div');
    info.className = 'achievement-info';
    
    const titleElement = document.createElement('div');
    titleElement.className = 'achievement-title';
    titleElement.textContent = title;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-container';
    
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.style.width = `${progress}%`;
    bar.setAttribute('data-percentage', progress);
    
    const text = document.createElement('div');
    text.className = 'progress-text';
    text.textContent = progressText;
    
    progressBar.appendChild(bar);
    progressBar.appendChild(text);
    
    info.appendChild(titleElement);
    info.appendChild(progressBar);
    
    item.appendChild(icon);
    item.appendChild(info);
    
    return item;
}

// Handle window visibility change (pause when tab not visible)
function handleVisibilityChange() {
    if (document.hidden && gameState.state === GAME_STATES.PLAYING) {
        togglePause();
    }
}

// Share score on Twitter
function shareOnTwitter() {
    const text = `I scored ${gameState.score} points in Snake Xtreme! Can you beat my score? #SnakeXtreme`;
    const url = window.location.href;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

// Share score on Facebook
function shareOnFacebook() {
    const url = window.location.href;
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

// Copy score to clipboard
function copyScoreToClipboard() {
    const text = `I scored ${gameState.score} points in Snake Xtreme! Can you beat my score?`;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showMessage('Score copied to clipboard!', 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showMessage('Failed to copy to clipboard', 2000);
        });
}

// Handle settings changes
function handleSettingsChange(setting, value) {
    switch (setting) {
        case 'particleEffects':
            settings.particleEffects = value;
            break;
        case 'soundVolume':
            settings.soundVolume = parseInt(value);
            break;
        case 'gridVisibility':
            settings.gridVisibility = value === 'on';
            break;
        case 'crtEffect':
            settings.crtEffect = value === 'on';
            break;
        case 'highContrast':
            settings.highContrast = value;
            break;
    }
    
    // Apply settings immediately
    applySettings();
    
    // Save settings
    saveGameData();
}

// Handle window resize
function handleResize() {
    // Show/hide mobile controls based on screen width
    if (window.innerWidth < 768) {
        domElements.mobileControls.style.display = gameState.state === GAME_STATES.PLAYING ? 'flex' : 'none';
    } else {
        domElements.mobileControls.style.display = 'none';
    }
}

// Initialize
async function init() {
    // Load configuration
    await loadConfig();
    
    // Initialize canvas
    initCanvas();
    
    // Load game data
    loadGameData();
    
    // Preload sounds
    preloadSounds();
    
    // Set up event listeners
    
    // Keyboard input
    document.addEventListener('keydown', handleKeydown);
    
    // Touch input
    domElements.gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElements.gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElements.gameCanvas.addEventListener('touchend', handleTouchEnd);
    
    // Mobile control buttons
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    
    upButton.addEventListener('click', () => handleMobileButtonClick('up'));
    downButton.addEventListener('click', () => handleMobileButtonClick('down'));
    leftButton.addEventListener('click', () => handleMobileButtonClick('left'));
    rightButton.addEventListener('click', () => handleMobileButtonClick('right'));
    
    // Pause button
    domElements.pauseButton.addEventListener('click', togglePause);
    
    // Main menu buttons
    domElements.playButton.addEventListener('click', startGame);
    domElements.shopButton.addEventListener('click', showShop);
    domElements.settingsButton.addEventListener('click', showSettings);
    domElements.achievementsButton.addEventListener('click', showAchievements);
    
    // Game mode buttons
    domElements.classicMode.addEventListener('click', () => setActiveGameMode(GAME_MODES.CLASSIC));
    domElements.noWallsMode.addEventListener('click', () => setActiveGameMode(GAME_MODES.NO_WALLS));
    domElements.timeAttackMode.addEventListener('click', () => setActiveGameMode(GAME_MODES.TIME_ATTACK));
    domElements.mazeMode.addEventListener('click', () => setActiveGameMode(GAME_MODES.MAZE));
    
    // Difficulty buttons
    domElements.easyMode.addEventListener('click', () => setActiveDifficulty(DIFFICULTIES.EASY));
    domElements.mediumMode.addEventListener('click', () => setActiveDifficulty(DIFFICULTIES.MEDIUM));
    domElements.hardMode.addEventListener('click', () => setActiveDifficulty(DIFFICULTIES.HARD));
    
    // Game over screen buttons
    domElements.restartButton.addEventListener('click', restartGame);
    domElements.leaderboardButton.addEventListener('click', showLeaderboard);
    domElements.menuButton.addEventListener('click', goToMainMenu);
    
    // Social sharing buttons
    domElements.shareTwitter.addEventListener('click', shareOnTwitter);
    domElements.shareFacebook.addEventListener('click', shareOnFacebook);
    domElements.copyScore.addEventListener('click', copyScoreToClipboard);
    
    // Leaderboard back button
    domElements.backToGame.addEventListener('click', () => {
        domElements.leaderboard.style.display = 'none';
        domElements.gameOverScreen.style.display = 'flex';
    });
    
    // Pause menu buttons
    domElements.resumeButton.addEventListener('click', resumeGame);
    domElements.restartFromPauseButton.addEventListener('click', restartGame);
    domElements.settingsFromPauseButton.addEventListener('click', showSettings);
    domElements.menuFromPauseButton.addEventListener('click', goToMainMenu);
    
    // Settings menu
    domElements.particleEffects.addEventListener('change', e => handleSettingsChange('particleEffects', e.target.value));
    domElements.soundVolume.addEventListener('input', e => handleSettingsChange('soundVolume', e.target.value));
    domElements.gridVisibility.addEventListener('change', e => handleSettingsChange('gridVisibility', e.target.value));
    domElements.crtEffect.addEventListener('change', e => handleSettingsChange('crtEffect', e.target.value));
    domElements.highContrast.addEventListener('change', e => handleSettingsChange('highContrast', e.target.checked));
    domElements.backToMenuFromSettings.addEventListener('click', goToMainMenu);
    
    // Shop back button
    domElements.backToMenuFromShop.addEventListener('click', goToMainMenu);
    
    // Achievements back button
    domElements.backToMenuFromAchievements.addEventListener('click', goToMainMenu);
    
    // Visibility change (pause when tab not visible)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window resize
    window.addEventListener('resize', handleResize);
    
    // Initial resize handler call
    handleResize();
    
    // Show main menu
    goToMainMenu();
}

// Start the game
window.addEventListener('load', init); 