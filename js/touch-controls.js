/**
 * Touch controls for mobile devices
 * Compatible with game.js and game-enhancement.js
 */

class TouchControls {
  constructor(gameContainer) {
    this.gameContainer = gameContainer;
    this.enabled = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 30; // Minimum distance for a swipe
    this.handlers = {
      touchStart: null,
      touchMove: null,
      touchEnd: null
    };
    
    // Direction callback
    this.onDirectionChange = null;
    
    // Check if device supports touch
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  init(onDirectionChange) {
    if (!this.isTouchDevice) return false;
    
    this.onDirectionChange = onDirectionChange;
    
    // Only add touch controls if not already enabled
    if (!this.enabled) {
      this.createTouchOverlay();
      this.attachEventListeners();
      this.enabled = true;
    }
    
    return true;
  }
  
  createTouchOverlay() {
    // Create overlay for showing touch direction
    this.overlay = document.createElement('div');
    this.overlay.className = 'touch-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100;
      pointer-events: none;
    `;
    
    // Add direction indicators
    const directions = ['up', 'right', 'down', 'left'];
    directions.forEach(dir => {
      const arrow = document.createElement('div');
      arrow.className = `touch-arrow ${dir}`;
      arrow.dataset.direction = dir;
      arrow.style.cssText = `
        position: absolute;
        width: 60px;
        height: 60px;
        opacity: 0.5;
        pointer-events: none;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        transition: opacity 0.2s ease;
      `;
      
      // Position each arrow
      switch(dir) {
        case 'up':
          arrow.style.top = '10%';
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
          arrow.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%2300ff00\"><path d=\"M7,14l5-5 5,5z\"/></svg>')";
          break;
        case 'right':
          arrow.style.top = '50%';
          arrow.style.right = '10%';
          arrow.style.transform = 'translateY(-50%)';
          arrow.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%2300ff00\"><path d=\"M10,17l5-5-5-5z\"/></svg>')";
          break;
        case 'down':
          arrow.style.bottom = '10%';
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
          arrow.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%2300ff00\"><path d=\"M7,10l5,5 5-5z\"/></svg>')";
          break;
        case 'left':
          arrow.style.top = '50%';
          arrow.style.left = '10%';
          arrow.style.transform = 'translateY(-50%)';
          arrow.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"%2300ff00\"><path d=\"M14,17l-5-5 5-5z\"/></svg>')";
          break;
      }
      
      this.overlay.appendChild(arrow);
    });
    
    this.gameContainer.appendChild(this.overlay);
  }
  
  attachEventListeners() {
    this.handlers.touchStart = this.handleTouchStart.bind(this);
    this.handlers.touchMove = this.handleTouchMove.bind(this);
    this.handlers.touchEnd = this.handleTouchEnd.bind(this);
    
    // Use passive: false to prevent scrolling when playing
    this.gameContainer.addEventListener('touchstart', this.handlers.touchStart, { passive: false });
    this.gameContainer.addEventListener('touchmove', this.handlers.touchMove, { passive: false });
    this.gameContainer.addEventListener('touchend', this.handlers.touchEnd, { passive: false });
  }
  
  handleTouchStart(e) {
    // Only prevent default if game has started
    const gameState = window.gameState || '';
    if (gameState === 'playing') {
      e.preventDefault(); // Prevent scrolling during gameplay
    }
    
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }
  
  handleTouchMove(e) {
    if (!e.touches.length) return;
    
    // Only prevent default if game has started
    const gameState = window.gameState || '';
    if (gameState === 'playing') {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    const xDiff = this.touchStartX - touch.clientX;
    const yDiff = this.touchStartY - touch.clientY;
    
    // Only process if we have a significant movement
    if (Math.abs(xDiff) < this.swipeThreshold && Math.abs(yDiff) < this.swipeThreshold) {
      return;
    }
    
    // Determine direction (only trigger on clear directional movement)
    let direction = null;
    
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      direction = xDiff > 0 ? 'LEFT' : 'RIGHT';
    } else {
      direction = yDiff > 0 ? 'UP' : 'DOWN';
    }
    
    if (direction && this.onDirectionChange) {
      this.highlightDirection(direction);
      this.onDirectionChange(direction);
      
      // Reset start position to prevent multiple triggers from same swipe
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }
  }
  
  handleTouchEnd() {
    // Reset highlight after a delay
    setTimeout(() => this.resetHighlights(), 200);
  }
  
  // Show visual feedback for direction
  highlightDirection(dir) {
    // Map to lowercase for DOM elements
    const dirMap = {
      'UP': 'up',
      'RIGHT': 'right',
      'DOWN': 'down',
      'LEFT': 'left'
    };
    
    const dirLower = dirMap[dir];
    
    // Remove existing highlights
    this.resetHighlights();
    
    // Add highlight to the swiped direction
    const arrow = this.overlay.querySelector(`.touch-arrow.${dirLower}`);
    if (arrow) {
      arrow.style.opacity = '1';
    }
  }
  
  resetHighlights() {
    const arrows = this.overlay.querySelectorAll('.touch-arrow');
    arrows.forEach(arrow => {
      arrow.style.opacity = '0.5';
    });
  }
  
  // Additional touch controls - tap to start/pause
  enableTapToStart() {
    const tapHandler = (e) => {
      // Get the current game state from global variable
      const currentGameState = window.gameState || 'unknown';
      
      // Log for troubleshooting
      console.log(`Touch received while game state is: ${currentGameState}`);
      
      // Tap to start the game
      if (currentGameState === 'ready') {
        e.preventDefault();
        
        // Find and remove start message
        const startMessage = document.getElementById('start-message');
        if (startMessage && startMessage.parentNode) {
          startMessage.parentNode.removeChild(startMessage);
        }
        
        // Update game state
        if (window.gameState !== undefined) {
          window.gameState = 'playing';
          console.log('Game state updated to playing via touch');
          
          // Also update the snake-game's internal state if accessible
          if (typeof gameState !== 'undefined') {
            gameState = 'playing';
          }
          
          // Reset game start time
          if (window.gameStartTime !== undefined) {
            window.gameStartTime = performance.now();
          }
        }
      }
      // Tap to restart after game over
      else if (currentGameState === 'gameover') {
        e.preventDefault();
        
        // Find and click restart button
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
          restartButton.click();
          console.log('Restart button clicked via touch');
        }
      }
    };
    
    // Use touchend instead of touchstart for more reliable tap detection
    this.gameContainer.addEventListener('touchend', tapHandler, { passive: false });
    
    // Store for cleanup
    this.handlers.tapEnd = tapHandler;
    
    console.log('Tap to start/restart enabled');
  }
  
  disable() {
    if (!this.enabled) return;
    
    // Remove event listeners
    if (this.handlers.touchStart) {
      this.gameContainer.removeEventListener('touchstart', this.handlers.touchStart);
      this.gameContainer.removeEventListener('touchmove', this.handlers.touchMove);
      this.gameContainer.removeEventListener('touchend', this.handlers.touchEnd);
    }
    
    if (this.handlers.tapEnd) {
      this.gameContainer.removeEventListener('touchend', this.handlers.tapEnd);
    }
    
    // Remove overlay
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.enabled = false;
    console.log('Touch controls disabled and cleaned up');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = TouchControls;
}
