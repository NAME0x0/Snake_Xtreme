// Game variables
let scene, camera, renderer, snakeMaterial, snake, food, powerUp, obstacles = [], easterEgg;
let gridSize = 20, cellSize = 1;
let direction = { x: 1, z: 0 }, nextDirection = { x: 1, z: 0 };
let lastMoveTime = 0, speedBoostEndTime = 0, shieldActive = false;
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0, multiplier = 1;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let ownedColors = JSON.parse(localStorage.getItem('ownedColors')) || ['green'];
let selectedColor = localStorage.getItem('selectedColor') || 'green';
let gameState = 'home';
let controls = localStorage.getItem('controls') || 'arrow';
let difficulty = localStorage.getItem('difficulty') || 'medium';
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const snakeColors = {
    green: { color: 0x00ff00, price: 0 },
    red: { color: 0xff0000, price: 50 },
    blue: { color: 0x0000ff, price: 100 }
};

const moveIntervals = {
    easy: 250,
    medium: 200,
    hard: 150
};

// Sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// UI elements
const homeScreen = document.getElementById('home-screen');
const shopScreen = document.getElementById('shop-screen');
const settingsScreen = document.getElementById('settings-screen');
const gameContainer = document.getElementById('game-container');
const gameCanvas = document.getElementById('game-canvas');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const coinDisplay = document.getElementById('coin-display');
const shopCoinDisplay = document.getElementById('shop-coin-display');

// Update displays
function updateDisplays() {
    coinDisplay.textContent = coins;
    shopCoinDisplay.textContent = coins;
    scoreDisplay.textContent = `Score: ${score} (x${Math.round(multiplier * 10) / 10})`;
    finalScoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
}
updateDisplays();

// Shop logic
function generateShop() {
    const colorList = document.getElementById('color-list');
    colorList.innerHTML = '';
    for (const color in snakeColors) {
        const button = document.createElement('button');
        if (ownedColors.includes(color)) {
            button.textContent = `Select ${color}`;
            button.onclick = () => {
                selectedColor = color;
                localStorage.setItem('selectedColor', color);
                if (snakeMaterial) snakeMaterial.color.setHex(snakeColors[color].color);
            };
        } else {
            button.textContent = `Buy ${color} (${snakeColors[color].price} coins)`;
            button.onclick = () => {
                if (coins >= snakeColors[color].price) {
                    coins -= snakeColors[color].price;
                    ownedColors.push(color);
                    selectedColor = color;
                    localStorage.setItem('ownedColors', JSON.stringify(ownedColors));
                    localStorage.setItem('selectedColor', color);
                    localStorage.setItem('coins', coins);
                    updateDisplays();
                    generateShop();
                } else {
                    alert('Not enough coins!');
                }
            };
        }
        colorList.appendChild(button);
    }
}

// Event listeners
document.getElementById('play-button').addEventListener('click', () => {
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameState = 'playing';
    initScene();
    requestAnimationFrame(gameLoop);
});

document.getElementById('shop-button').addEventListener('click', () => {
    homeScreen.style.display = 'none';
    shopScreen.style.display = 'block';
    generateShop();
});

document.getElementById('settings-button').addEventListener('click', () => {
    homeScreen.style.display = 'none';
    settingsScreen.style.display = 'block';
});

document.getElementById('shop-back-button').addEventListener('click', () => {
    shopScreen.style.display = 'none';
    homeScreen.style.display = 'block';
});

document.getElementById('settings-back-button').addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    homeScreen.style.display = 'block';
});

document.getElementById('restart-button').addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    resetGame();
    gameState = 'playing';
});

document.getElementById('difficulty-easy').addEventListener('click', () => {
    difficulty = 'easy';
    localStorage.setItem('difficulty', difficulty);
});

document.getElementById('difficulty-medium').addEventListener('click', () => {
    difficulty = 'medium';
    localStorage.setItem('difficulty', difficulty);
});

document.getElementById('difficulty-hard').addEventListener('click', () => {
    difficulty = 'hard';
    localStorage.setItem('difficulty', difficulty);
});

document.getElementById('arrow-keys').addEventListener('click', () => {
    controls = 'arrow';
    localStorage.setItem('controls', controls);
    settingsScreen.style.display = 'none';
    homeScreen.style.display = 'block';
});

document.getElementById('wasd-keys').addEventListener('click', () => {
    controls = 'wasd';
    localStorage.setItem('controls', controls);
    settingsScreen.style.display = 'none';
    homeScreen.style.display = 'block';
});

// Touch controls
if (isMobile) {
    document.getElementById('touch-controls').style.display = 'flex';
    document.getElementById('touch-up').addEventListener('touchstart', () => {
        if (direction.z !== 1) nextDirection = { x: 0, z: -1 };
    });
    document.getElementById('touch-down').addEventListener('touchstart', () => {
        if (direction.z !== -1) nextDirection = { x: 0, z: 1 };
    });
    document.getElementById('touch-left').addEventListener('touchstart', () => {
        if (direction.x !== 1) nextDirection = { x: -1, z: 0 };
    });
    document.getElementById('touch-right').addEventListener('touchstart', () => {
        if (direction.x !== -1) nextDirection = { x: 1, z: 0 };
    });
}

// Scene setup
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 0);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ canvas: gameCanvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.background = new THREE.Color(0x87ceeb);

    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    snakeMaterial = new THREE.MeshStandardMaterial({ color: snakeColors[selectedColor].color });
    const startGridX = Math.floor(gridSize / 2);
    const startGridZ = Math.floor(gridSize / 2);
    const worldPos = gridToWorld(startGridX, startGridZ);
    snake = {
        segments: [{ x: startGridX, z: startGridZ }],
        meshes: [],
        targetPositions: [worldPos],
        trail: []
    };
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), snakeMaterial);
    head.position.set(worldPos.x, 0.4, worldPos.z);
    head.castShadow = true;
    scene.add(head);
    snake.meshes.push(head);

    spawnFood();
    if (Math.random() < 0.3) spawnPowerUp();
    if (score >= 50) spawnObstacles();
    if (score >= 100 && !easterEgg) spawnEasterEgg();

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
}

// Spawn functions
function gridToWorld(gridX, gridZ) {
    return { x: gridX - gridSize / 2 + 0.5, z: gridZ - gridSize / 2 + 0.5 };
}

function spawnFood() {
    const foodGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const foodMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    food = new THREE.Mesh(foodGeometry, foodMaterial);
    food.gridX = Math.floor(Math.random() * gridSize);
    food.gridZ = Math.floor(Math.random() * gridSize);
    const worldPos = gridToWorld(food.gridX, food.gridZ);
    food.position.set(worldPos.x, 0.4, worldPos.z);
    food.castShadow = true;
    scene.add(food);
}

function spawnPowerUp() {
    const powerUpGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const powerUpMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x333300 });
    powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.gridX = Math.floor(Math.random() * gridSize);
    powerUp.gridZ = Math.floor(Math.random() * gridSize);
    const worldPos = gridToWorld(powerUp.gridX, powerUp.gridZ);
    powerUp.position.set(worldPos.x, 0.4, worldPos.z);
    powerUp.castShadow = true;
    scene.add(powerUp);
}

function spawnObstacles() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (let i = 0; i < 3; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.gridX = Math.floor(Math.random() * gridSize);
        obstacle.gridZ = Math.floor(Math.random() * gridSize);
        const worldPos = gridToWorld(obstacle.gridX, obstacle.gridZ);
        obstacle.position.set(worldPos.x, 0.5, worldPos.z);
        obstacle.castShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

function spawnEasterEgg() {
    const easterGeometry = new THREE.BoxGeometry(1, 1, 1);
    const easterMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x333300 });
    easterEgg = new THREE.Mesh(easterGeometry, easterMaterial);
    easterEgg.gridX = Math.floor(gridSize / 2);
    easterEgg.gridZ = Math.floor(gridSize / 2);
    const worldPos = gridToWorld(easterEgg.gridX, easterEgg.gridZ);
    easterEgg.position.set(worldPos.x, 0.5, worldPos.z);
    easterEgg.castShadow = true;
    scene.add(easterEgg);
}

// Game loop
function gameLoop(time) {
    if (gameState !== 'playing') return requestAnimationFrame(gameLoop);

    const moveInterval = speedBoostEndTime > time ? 100 : moveIntervals[difficulty];
    if (time - lastMoveTime > moveInterval) {
        moveSnake();
        lastMoveTime = time;
    }

    updateSnakeVisuals();
    if (score >= 100 && gridSize === 20) {
        gridSize = 30;
        resetGame();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// Snake movement and logic
function moveSnake() {
    direction = { ...nextDirection };
    let head = { x: snake.segments[0].x + direction.x, z: snake.segments[0].z + direction.z };

    if (difficulty === 'easy') {
        head.x = (head.x + gridSize) % gridSize;
        head.z = (head.z + gridSize) % gridSize;
    } else if (head.x < 0 || head.x >= gridSize || head.z < 0 || head.z >= gridSize) {
        if (shieldActive) {
            shieldActive = false;
            playSound(300, 0.1);
            return;
        }
        endGame();
        return;
    }

    const collisionCheck = snake.segments.some(seg => seg.x === head.x && seg.z === head.z) ||
        obstacles.some(obs => obs.gridX === head.x && obs.gridZ === head.z);
    if (collisionCheck) {
        if (shieldActive) {
            shieldActive = false;
            playSound(300, 0.1);
            return;
        }
        playSound(200, 0.2);
        endGame();
        return;
    }

    snake.segments.unshift(head);
    const worldHead = gridToWorld(head.x, head.z);
    snake.targetPositions.unshift(worldHead);
    const newHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), snakeMaterial);
    newHeadMesh.position.set(worldHead.x, 0.4, worldHead.z);
    newHeadMesh.castShadow = true;
    scene.add(newHeadMesh);
    snake.meshes.unshift(newHeadMesh);

    if (head.x === food.gridX && head.z === food.gridZ) {
        score += 10 * multiplier;
        multiplier++;
        coins++;
        localStorage.setItem('coins', coins);
        playSound(500, 0.1);
        scene.remove(food);
        spawnFood();
    } else if (powerUp && head.x === powerUp.gridX && head.z === powerUp.gridZ) {
        playSound(700, 0.1);
        if (Math.random() < 0.5) speedBoostEndTime = Date.now() + 5000;
        else shieldActive = true;
        scene.remove(powerUp);
        powerUp = null;
        if (Math.random() < 0.3) spawnPowerUp();
    } else if (easterEgg && head.x === easterEgg.gridX && head.z === easterEgg.gridZ) {
        score += 50;
        coins += 10;
        localStorage.setItem('coins', coins);
        playSound(800, 0.2);
        scene.remove(easterEgg);
        easterEgg = null;
    } else {
        snake.segments.pop();
        snake.targetPositions.pop();
        const lastMesh = snake.meshes.pop();
        scene.remove(lastMesh);
        multiplier = Math.max(1, multiplier - 0.1);
    }
    updateDisplays();
}

function updateSnakeVisuals() {
    snake.meshes.forEach((mesh, i) => {
        const target = snake.targetPositions[i];
        mesh.position.x += (target.x - mesh.position.x) * 0.1;
        mesh.position.z += (target.z - mesh.position.z) * 0.1;
    });

    const trailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const trailMaterial = new THREE.MeshBasicMaterial({ color: snakeColors[selectedColor].color, transparent: true, opacity: 0.3 });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.copy(snake.meshes[0].position);
    scene.add(trail);
    snake.trail.push(trail);
    if (snake.trail.length > 10) scene.remove(snake.trail.shift());
}

function endGame() {
    gameState = 'gameover';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'block';
    updateDisplays();
}

function resetGame() {
    scene.children.forEach(child => scene.remove(child));
    snake = null;
    food = null;
    powerUp = null;
    obstacles = [];
    easterEgg = null;
    score = 0;
    multiplier = 1;
    direction = { x: 1, z: 0 };
    nextDirection = { x: 1, z: 0 };
    speedBoostEndTime = 0;
    shieldActive = false;
    initScene();
    updateDisplays();
}

// Input handling
document.addEventListener('keydown', (event) => {
    if (gameState !== 'playing') return;
    const key = event.key.toLowerCase();
    if ((controls === 'arrow' && key === 'arrowup') || (controls === 'wasd' && key === 'w')) {
        if (direction.z !== 1) nextDirection = { x: 0, z: -1 };
    } else if ((controls === 'arrow' && key === 'arrowdown') || (controls === 'wasd' && key === 's')) {
        if (direction.z !== -1) nextDirection = { x: 0, z: 1 };
    } else if ((controls === 'arrow' && key === 'arrowleft') || (controls === 'wasd' && key === 'a')) {
        if (direction.x !== 1) nextDirection = { x: -1, z: 0 };
    } else if ((controls === 'arrow' && key === 'arrowright') || (controls === 'wasd' && key === 'd')) {
        if (direction.x !== -1) nextDirection = { x: 1, z: 0 };
    }
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Initial setup
document.getElementById('difficulty-' + difficulty).style.backgroundColor = '#0c0';