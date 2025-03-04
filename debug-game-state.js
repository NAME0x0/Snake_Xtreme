/**
 * Debug utilities to help track down the Snake game issues
 */

// Create a global debug namespace
window.SnakeDebug = {
  isActive: true,
  intervalId: null,
  
  // Initialize debug tools
  init: function() {
    console.log("Snake debug tools initialized");
    
    // Create debug HUD if it doesn't exist
    if (!document.getElementById('snake-debug-hud')) {
      const hud = document.createElement('div');
      hud.id = 'snake-debug-hud';
      hud.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: lime;
        font-family: monospace;
        padding: 10px;
        border: 1px solid lime;
        z-index: 9999;
        font-size: 12px;
      `;
      document.body.appendChild(hud);
    }
    
    // Create a "fix game" button
    const fixButton = document.createElement('button');
    fixButton.textContent = "Emergency Fix";
    fixButton.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: red;
      color: white;
      z-index: 10000;
    `;
    fixButton.onclick = this.emergencyFix;
    document.body.appendChild(fixButton);
    
    // Start monitoring game state
    this.startMonitoring();
  },
  
  // Monitor game state and display debug info
  startMonitoring: function() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(() => {
      if (!this.isActive) return;
      
      const hud = document.getElementById('snake-debug-hud');
      if (!hud) return;
      
      // Get current game state
      const state = {
        gameState: window.gameState || 'unknown',
        snake: window.snake ? {
          segments: window.snake.segments ? window.snake.segments.length : 'N/A',
          head: window.snake.segments && window.snake.segments.length > 0 ? 
            `(${window.snake.segments[0].x},${window.snake.segments[0].y})` : 'N/A',
          direction: window.snake.direction || 'N/A'
        } : 'No Snake',
        food: window.food ? `(${window.food.x || window.food.gridX},${window.food.y || window.food.gridY})` : 'No Food',
        direction: window.direction ? `{x:${window.direction.x}, y:${window.direction.y}}` : 'Unknown',
        nextDirection: window.nextDirection ? `{x:${window.nextDirection.x}, y:${window.nextDirection.y}}` : 'Unknown',
        canvas: document.getElementById('game-canvas') ? 
          `${document.getElementById('game-canvas').width}x${document.getElementById('game-canvas').height}` : 'No Canvas'
      };
      
      // Update HUD
      hud.innerHTML = `
        <div>Game State: <b>${state.gameState}</b></div>
        <div>Snake: <b>${typeof state.snake === 'string' ? state.snake : 
          `${state.snake.segments} segments, Head: ${state.snake.head}, Dir: ${state.snake.direction}`}</b></div>
        <div>Food: <b>${state.food}</b></div>
        <div>Direction: <b>${state.direction}</b> → Next: <b>${state.nextDirection}</b></div>
        <div>Canvas: <b>${state.canvas}</b></div>
      `;
    }, 500);
  },
  
  // Emergency fix function
  emergencyFix: function() {
    console.log("Applying emergency fix to the game...");
    
    // Force re-initialization of snake if it's missing
    if (!window.snake || !window.snake.segments || window.snake.segments.length === 0) {
      window.snake = {
        segments: [{ x: 10, y: 10 }],
        body: [{ x: 10, y: 10 }],
        direction: 'RIGHT'
      };
      console.log("Snake re-initialized:", window.snake);
    }
    
    // Ensure all required objects exist
    if (!window.direction) window.direction = { x: 1, y: 0 };
    if (!window.nextDirection) window.nextDirection = { x: 1, y: 0 };
    
    // Reset game state to playing
    window.gameState = 'playing';
    if (typeof gameState !== 'undefined') {
      gameState = 'playing';
      console.log("Game state reset to 'playing'");
    }
    
    // Force redraw if canvas exists
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && window.RenderUtils) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Force draw snake
        if (window.RenderUtils.drawSnake && window.snake) {
          window.RenderUtils.drawSnake(ctx, window.snake, 20);
        }
        
        console.log("Force redrew the snake");
      }
    }
    
    // Remove any start message
    const startMessage = document.getElementById('start-message');
    if (startMessage && startMessage.parentNode) {
      startMessage.parentNode.removeChild(startMessage);
      console.log("Removed start message");
    }
    
    // Try to restart the game loop
    if (typeof initializeGame === 'function') {
      console.log("Attempting to re-initialize game...");
      try {
        initializeGame();
      } catch (e) {
        console.error("Error re-initializing game:", e);
      }
    }
    
    if (typeof debugLog === 'function') {
      debugLog("Emergency fix applied!");
    }
    
    alert("Emergency fix applied. Check console for details.");
  },
  
  // Toggle debug mode
  toggle: function() {
    this.isActive = !this.isActive;
    const hud = document.getElementById('snake-debug-hud');
    if (hud) hud.style.display = this.isActive ? 'block' : 'none';
    console.log(`Debug mode ${this.isActive ? 'enabled' : 'disabled'}`);
    return this.isActive;
  }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
  window.SnakeDebug.init();
});
