/**
 * Centralized input handling for Snake_Xtreme
 * This helps ensure key events are properly registered and processed
 */

class InputHandler {
  constructor(gameStateCallback) {
    this.gameStateCallback = gameStateCallback || function() {};
    this.keyHandlers = {};
    this.enabled = false;
    
    // Direction info for debug purposes
    this.lastDirection = null;
    
    console.log("Input Handler initialized");
  }
  
  /**
   * Enable keyboard input handling
   */
  enable() {
    if (this.enabled) return;
    
    // Set up all needed handlers
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Track whether input is enabled
    this.enabled = true;
    console.log("Input handling enabled");
  }
  
  /**
   * Disable input handling
   */
  disable() {
    if (!this.enabled) return;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    this.enabled = false;
    console.log("Input handling disabled");
  }
  
  /**
   * Register a callback for a specific key
   */
  registerKeyHandler(key, callback) {
    this.keyHandlers[key.toLowerCase()] = callback;
  }
  
  /**
   * Register a direction change handler
   */
  registerDirectionHandler(callback) {
    this.directionHandler = callback;
  }
  
  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    const code = event.code;
    
    console.log(`Key pressed: ${key} (code: ${code})`);
    
    // Direct start handler for Space key 
    if (code === 'Space' || key === ' ') {
      console.log("Space key detected!");
      
      // Try to get game state
      const currentState = window.gameState || 'unknown';
      console.log(`Current game state: ${currentState}`);
      
      if (currentState === 'ready' || currentState === 'gameover') {
        console.log("Starting game due to space key!");
        
        // Try to notify about state change
        this.gameStateCallback('playing');
        
        // Update global state as backup
        window.gameState = 'playing';
        
        if (typeof debugLog !== 'undefined') {
          debugLog('Space pressed - starting game!');
        }
        
        // Remove start message if exists
        const startMessage = document.getElementById('start-message');
        if (startMessage && startMessage.parentNode) {
          startMessage.parentNode.removeChild(startMessage);
          console.log("Start message removed by InputHandler");
        }
        
        // Prevent default space behavior (scroll)
        event.preventDefault();
        return;
      }
    }
    
    // Check for registered handlers
    if (this.keyHandlers[key]) {
      this.keyHandlers[key](event);
      event.preventDefault();
    }
    
    // Handle direction keys
    const direction = this.getDirectionFromKey(key, code);
    if (direction && this.directionHandler) {
      this.lastDirection = direction;
      this.directionHandler(direction);
      
      if (typeof debugLog !== 'undefined') {
        debugLog(`Direction changed to: ${direction.x},${direction.y}`);
      }
    }
  }
  
  /**
   * Get direction vector from key input
   */
  getDirectionFromKey(key, code) {
    // Handle arrow keys and WASD
    switch (key) {
      case 'arrowup':
      case 'w':
        return { x: 0, y: -1 };
        
      case 'arrowdown':
      case 's':
        return { x: 0, y: 1 };
        
      case 'arrowleft':
      case 'a':
        return { x: -1, y: 0 };
        
      case 'arrowright':
      case 'd':
        return { x: 1, y: 0 };
        
      default:
        return null;
    }
  }
}

// Make available globally
window.InputHandler = InputHandler;
