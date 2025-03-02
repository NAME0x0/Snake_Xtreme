// Helper function to set individual pixels on a canvas
function setPixel(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Ground Texture: 32x32 retro grid with black background and cyan lines
const groundCanvas = document.createElement('canvas');
groundCanvas.width = 32;
groundCanvas.height = 32;
const groundCtx = groundCanvas.getContext('2d');
for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
        if (x % 4 === 0 || y % 4 === 0) {
            setPixel(groundCtx, x, y, '#00ffff'); // Cyan grid lines
        } else {
            setPixel(groundCtx, x, y, '#000000'); // Black background
        }
    }
}
const groundTexture = new THREE.Texture(groundCanvas);
groundTexture.needsUpdate = true;
groundTexture.magFilter = THREE.NearestFilter; // Retro pixelated look
groundTexture.minFilter = THREE.NearestFilter;

// Snake Texture: 16x16 Gundam-inspired robot
const snakeCanvas = document.createElement('canvas');
snakeCanvas.width = 16;
snakeCanvas.height = 16;
const snakeCtx = snakeCanvas.getContext('2d');
snakeCtx.fillStyle = '#808080'; // Metallic gray
snakeCtx.fillRect(0, 0, 16, 16);
// Blue panel lines for Gundam aesthetic
snakeCtx.strokeStyle = '#0000ff';
snakeCtx.lineWidth = 1;
snakeCtx.strokeRect(2, 2, 12, 12); // Outer panels
snakeCtx.beginPath();
snakeCtx.moveTo(8, 2);
snakeCtx.lineTo(8, 14); // Vertical panel line
snakeCtx.stroke();
// Red optical sensors (eyes)
setPixel(snakeCtx, 5, 4, '#ff0000');
setPixel(snakeCtx, 10, 4, '#ff0000');
const snakeTexture = new THREE.Texture(snakeCanvas);
snakeTexture.needsUpdate = true;
snakeTexture.magFilter = THREE.NearestFilter;
snakeTexture.minFilter = THREE.NearestFilter;

// Normal Food Texture: 16x16 glowing yellow orb
const foodCanvas = document.createElement('canvas');
foodCanvas.width = 16;
foodCanvas.height = 16;
const foodCtx = foodCanvas.getContext('2d');
const centerX = 8;
const centerY = 8;
const radius = 6;
for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
            setPixel(foodCtx, x, y, dist < 2 ? '#ffffff' : '#ffff00'); // White center, yellow edges
        } else {
            setPixel(foodCtx, x, y, '#000000'); // Black background
        }
    }
}
const foodTexture = new THREE.Texture(foodCanvas);
foodTexture.needsUpdate = true;
foodTexture.magFilter = THREE.NearestFilter;
foodTexture.minFilter = THREE.NearestFilter;

// Speed Power-Up Texture: 16x16 yellow booster with exhaust
const speedCanvas = document.createElement('canvas');
speedCanvas.width = 16;
speedCanvas.height = 16;
const speedCtx = speedCanvas.getContext('2d');
for (let y = 4; y <= 12; y++) {
    const minX = Math.max(0, 8 - (y - 4));
    const maxX = Math.min(15, 8 + (y - 4));
    for (let x = minX; x <= maxX; x++) {
        setPixel(speedCtx, x, y, '#ffff00'); // Yellow booster
    }
}
// Add exhaust trails
for (let y = 13; y < 16; y++) {
    setPixel(speedCtx, 7, y, '#ff8000'); // Orange exhaust
    setPixel(speedCtx, 8, y, '#ff8000');
}
const speedTexture = new THREE.Texture(speedCanvas);
speedTexture.needsUpdate = true;
speedTexture.magFilter = THREE.NearestFilter;
speedTexture.minFilter = THREE.NearestFilter;

// Invincibility Power-Up Texture: 16x16 blue shield with white cross
const invincibleCanvas = document.createElement('canvas');
invincibleCanvas.width = 16;
invincibleCanvas.height = 16;
const invincibleCtx = invincibleCanvas.getContext('2d');
for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
        const dx = x - 8;
        const dy = y - 8;
        if (dx * dx + dy * dy < 36) { // Radius 6
            setPixel(invincibleCtx, x, y, '#0000ff'); // Blue shield
        }
    }
}
// White cross overlay
for (let i = 4; i < 12; i++) {
    setPixel(invincibleCtx, i, 8, '#ffffff'); // Horizontal
    setPixel(invincibleCtx, 8, i, '#ffffff'); // Vertical
}
const invincibleTexture = new THREE.Texture(invincibleCanvas);
invincibleTexture.needsUpdate = true;
invincibleTexture.magFilter = THREE.NearestFilter;
invincibleTexture.minFilter = THREE.NearestFilter;

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Ground Plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid to World Coordinates
const gridToWorld = (x, z) => new THREE.Vector3(x - 9.5, 0.4, z - 9.5);

// Snake Class
const snakeMaterial = new THREE.MeshPhongMaterial({ map: snakeTexture });

class Snake {
    constructor(scene) {
        this.segments = [[10, 10]];
        this.direction = [1, 0];
        this.meshes = [];
        const initialMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), snakeMaterial);
        initialMesh.position.copy(gridToWorld(10, 10));
        initialMesh.castShadow = true;
        scene.add(initialMesh);
        this.meshes.push(initialMesh);
    }

    move(grow = false) {
        const head = this.segments[0];
        const newHead = [head[0] + this.direction[0], head[1] + this.direction[1]];
        this.segments.unshift(newHead);
        if (!grow) {
            this.segments.pop();
        } else {
            const newMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), snakeMaterial);
            newMesh.castShadow = true;
            scene.add(newMesh);
            this.meshes.unshift(newMesh);
        }
        this.segments.forEach((seg, index) => {
            this.meshes[index].position.copy(gridToWorld(seg[0], seg[1]));
        });
    }
}

// Food Class
class Food {
    constructor(scene) {
        this.type = Math.random() < 0.2 ? 'speed' : Math.random() < 0.4 ? 'invincible' : 'normal';
        this.position = [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)];
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.4),
            new THREE.MeshPhongMaterial({ map: this.getTexture() })
        );
        this.mesh.position.copy(gridToWorld(this.position[0], this.position[1]));
        this.mesh.castShadow = true;
        scene.add(this.mesh);
    }

    getTexture() {
        return this.type === 'speed' ? speedTexture :
               this.type === 'invincible' ? invincibleTexture :
               foodTexture;
    }

    respawn() {
        this.type = Math.random() < 0.2 ? 'speed' : Math.random() < 0.4 ? 'invincible' : 'normal';
        do {
            this.position = [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)];
        } while (
            snake.segments.some(seg => seg[0] === this.position[0] && seg[1] === this.position[1]) ||
            obstacles.some(obs => obs[0] === this.position[0] && obs[1] === this.position[1])
        );
        this.mesh.position.copy(gridToWorld(this.position[0], this.position[1]));
        this.mesh.material.map = this.getTexture();
        this.mesh.material.needsUpdate = true;
    }
}

// Game State
const snake = new Snake(scene);
const food = new Food(scene);
const obstacles = [[9, 9], [9, 10], [10, 9], [10, 10]];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lastMoveTime = 0;
let moveInterval = 150;
let speedBoostEndTime = 0;
let invincibleEndTime = 0;
let gameState = 'menu'; // menu, playing, gameover

// Sound Effects (placeholders)
const eatSound = new Howl({ src: ['path/to/eat.wav'] });
const dieSound = new Howl({ src: ['path/to/die.wav'] });
const powerUpSound = new Howl({ src: ['path/to/powerup.wav'] });

// Input Handling
const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
};
document.addEventListener('keydown', (event) => {
    if (gameState === 'playing' && directions[event.key]) {
        const newDirection = directions[event.key];
        if (newDirection[0] !== -snake.direction[0] || newDirection[1] !== -snake.direction[1]) {
            snake.direction = newDirection;
        }
    }
});

// Window Resize Handling
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Start and Restart Buttons
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-menu').style.display = 'none';
    gameState = 'playing';
});

document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    resetGame();
    gameState = 'playing';
});

// Game Loop
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    if (gameState === 'playing') {
        moveInterval = currentTime < speedBoostEndTime ? 75 : 150;

        if (currentTime - lastMoveTime > moveInterval) {
            const head = snake.segments[0];
            const newHead = [head[0] + snake.direction[0], head[1] + snake.direction[1]];
            let grow = false;

            // Check for food
            if (newHead[0] === food.position[0] && newHead[1] === food.position[1]) {
                if (food.type === 'normal') {
                    score += 1;
                    eatSound.play();
                } else if (food.type === 'speed') {
                    speedBoostEndTime = currentTime + 5000;
                    powerUpSound.play();
                } else if (food.type === 'invincible') {
                    invincibleEndTime = currentTime + 5000;
                    powerUpSound.play();
                }
                grow = true;
            }

            // Collision Detection
            const collisionSegments = grow ? snake.segments : snake.segments.slice(0, -1);
            const isInvincible = currentTime < invincibleEndTime;
            if (newHead[0] < 0 || newHead[0] >= 20 || newHead[1] < 0 || newHead[1] >= 20 ||
                obstacles.some(obs => obs[0] === newHead[0] && obs[1] === newHead[1]) ||
                (!isInvincible && collisionSegments.some(seg => seg[0] === newHead[0] && seg[1] === newHead[1]))) {
                dieSound.play();
                gameState = 'gameover';
                document.getElementById('final-score').textContent = `Score: ${score}`;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('highScore', highScore);
                }
                document.getElementById('high-score').textContent = `High Score: ${highScore}`;
                document.getElementById('game-over').style.display = 'block';
            } else {
                snake.move(grow);
                if (grow) {
                    food.respawn();
                    document.getElementById('score').textContent = `Score: ${score}`;
                }
            }
            lastMoveTime = currentTime;
        }
    }

    renderer.render(scene, camera);
}

// Reset Game Function
function resetGame() {
    snake.segments = [[10, 10]];
    snake.direction = [1, 0];
    snake.meshes.forEach(mesh => scene.remove(mesh));
    snake.meshes = [];
    const initialMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), snakeMaterial);
    initialMesh.position.copy(gridToWorld(10, 10));
    initialMesh.castShadow = true;
    scene.add(initialMesh);
    snake.meshes.push(initialMesh);
    food.respawn();
    score = 0;
    speedBoostEndTime = 0;
    invincibleEndTime = 0;
    document.getElementById('score').textContent = `Score: 0`;
}

// Start the game loop
requestAnimationFrame(gameLoop);