// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Ground Plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Grid to World Coordinates
const gridToWorld = (x, z) => new THREE.Vector3(x - 9.5, 0, z - 9.5);

// Snake Class
const snakeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const snakeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

class Snake {
    constructor(scene) {
        this.segments = [[10, 10]];
        this.direction = [1, 0];
        this.meshes = [];
        const initialMesh = new THREE.Mesh(snakeGeometry, snakeMaterial);
        initialMesh.position.copy(gridToWorld(10, 10));
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
            const newMesh = new THREE.Mesh(snakeGeometry, snakeMaterial);
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
        this.type = Math.random() < 0.2 ? 'speed' : 'normal';
        this.position = [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)];
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.4),
            new THREE.MeshPhongMaterial({ color: this.type === 'speed' ? 0x0000ff : 0xff0000 })
        );
        this.mesh.position.copy(gridToWorld(this.position[0], this.position[1]));
        scene.add(this.mesh);
    }

    respawn() {
        this.type = Math.random() < 0.2 ? 'speed' : 'normal';
        do {
            this.position = [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)];
        } while (
            snake.segments.some(seg => seg[0] === this.position[0] && seg[1] === this.position[1]) ||
            obstacles.some(obs => obs[0] === this.position[0] && obs[1] === this.position[1])
        );
        this.mesh.position.copy(gridToWorld(this.position[0], this.position[1]));
        this.mesh.material.color.set(this.type === 'speed' ? 0x0000ff : 0xff0000);
    }
}

// Game State
const snake = new Snake(scene);
const food = new Food(scene);
const obstacles = [[9, 9], [9, 10], [10, 9], [10, 10]];
let score = 0;
let lastMoveTime = 0;
let moveInterval = 200;
let speedBoostEndTime = 0;

// Input Handling
const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
};
document.addEventListener('keydown', (event) => {
    if (directions[event.key]) {
        const newDirection = directions[event.key];
        if (newDirection[0] !== -snake.direction[0] || newDirection[1] !== -snake.direction[1]) {
            snake.direction = newDirection;
        }
    }
});

// Game Loop
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    // Update Speed
    moveInterval = currentTime < speedBoostEndTime ? 100 : 200;

    // Move Snake
    if (currentTime - lastMoveTime > moveInterval) {
        const head = snake.segments[0];
        const newHead = [head[0] + snake.direction[0], head[1] + snake.direction[1]];
        let grow = false;
        if (newHead[0] === food.position[0] && newHead[1] === food.position[1]) {
            if (food.type === 'normal') {
                score += 1;
            } else if (food.type === 'speed') {
                speedBoostEndTime = currentTime + 5000; // 5-second speed boost
            }
            food.respawn();
            grow = true;
            document.getElementById('score').textContent = `Score: ${score}`;
        }
        snake.move(grow);

        // Collision Detection
        if (newHead[0] < 0 || newHead[0] >= 20 || newHead[1] < 0 || newHead[1] >= 20 ||
            snake.segments.slice(1).some(seg => seg[0] === newHead[0] && seg[1] === newHead[1]) ||
            obstacles.some(obs => obs[0] === newHead[0] && obs[1] === newHead[1])) {
            alert('Game Over');
            // Reset Game
            snake.segments = [[10, 10]];
            snake.direction = [1, 0];
            snake.meshes.forEach(mesh => scene.remove(mesh));
            snake.meshes = [];
            const initialMesh = new THREE.Mesh(snakeGeometry, snakeMaterial);
            initialMesh.position.copy(gridToWorld(10, 10));
            scene.add(initialMesh);
            snake.meshes.push(initialMesh);
            food.respawn();
            score = 0;
            speedBoostEndTime = 0;
            document.getElementById('score').textContent = `Score: 0`;
        }
        lastMoveTime = currentTime;
    }

    // Render
    renderer.render(scene, camera);
}
requestAnimationFrame(gameLoop);
