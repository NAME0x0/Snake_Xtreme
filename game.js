// Game variables
let scene, camera, renderer, snakeMaterial, snake, food, powerUp, obstacles = [], easterEgg;
let gridSize = 20, cellSize = 1;
let direction = { x: 1, z: 0 }, nextDirection = { x: 1, z: 0 };
let lastMoveTime = 0, speedBoostEndTime = 0, shieldActive = false;
let score = 0, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let gameState = 'menu';
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const gameCanvas = document.getElementById('game-canvas');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreGameOverDisplay = document.getElementById('high-score-display');

// Update displays
function updateDisplays() {
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    finalScoreDisplay.textContent = score;
    highScoreGameOverDisplay.textContent = highScore;
}
updateDisplays();

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

    // Grid ground
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid lines
    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x000000, 0x000000);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Snake
    snakeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const startGridX = Math.floor(gridSize / 2);
    const startGridZ = Math.floor(gridSize / 2);
    const worldPos = gridToWorld(startGridX, startGridZ);
    snake = {
        segments: [{ x: startGridX, z: startGridZ }],
        meshes: [],
        targetPositions: [worldPos]
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
    const powerUpMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
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
    const easterMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
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

    const moveInterval = speedBoostEndTime > time ? 100 : 200;
    if (time - lastMoveTime > moveInterval) {
        moveSnake();
        lastMoveTime = time;
    }

    updateSnakeVisuals();
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// Snake movement
function moveSnake() {
    direction = { ...nextDirection };
    let head = { x: snake.segments[0].x + direction.x, z: snake.segments[0].z + direction.z };

    if (head.x < 0 || head.x >= gridSize || head.z < 0 || head.z >= gridSize) {
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
        score += 10;
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
        playSound(800, 0.2);
        scene.remove(easterEgg);
        easterEgg = null;
    } else {
        snake.segments.pop();
        snake.targetPositions.pop();
        const lastMesh = snake.meshes.pop();
        scene.remove(lastMesh);
    }
    updateDisplays();
}

function updateSnakeVisuals() {
    snake.meshes.forEach((mesh, i) => {
        const target = snake.targetPositions[i];
        mesh.position.x += (target.x - mesh.position.x) * 0.1;
        mesh.position.z += (target.z - mesh.position.z) * 0.1;
    });
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

// Input handling
document.addEventListener('keydown', (event) => {
    if (gameState !== 'playing') return;
    switch (event.key) {
        case 'ArrowUp':
            if (direction.z !== 1) nextDirection = { x: 0, z: -1 };
            break;
        case 'ArrowDown':
            if (direction.z !== -1) nextDirection = { x: 0, z: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) nextDirection = { x: -1, z: 0 };
            break;
        case 'ArrowRight':
            if (direction.x !== -1) nextDirection = { x: 1, z: 0 };
            break;
    }
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

// Start and restart
document.getElementById('play-button').addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameState = 'playing';
    initScene();
    requestAnimationFrame(gameLoop);
});

document.getElementById('restart-button').addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    resetGame();
    gameState = 'playing';
});

function resetGame() {
    scene.children.forEach(child => scene.remove(child));
    snake = null;
    food = null;
    powerUp = null;
    obstacles = [];
    easterEgg = null;
    score = 0;
    direction = { x: 1, z: 0 };
    nextDirection = { x: 1, z: 0 };
    speedBoostEndTime = 0;
    shieldActive = false;
    initScene();
    updateDisplays();
}

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});