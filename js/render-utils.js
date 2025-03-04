/**
 * Improved compatibility between RenderUtils and other modules
 */

const RenderUtils = (function() {
  // Share device detection with game-enhancement.js
  const deviceInfo = window.deviceInfo || {
    isLowEndDevice: detectLowEndDevice(),
    isMobile: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasAcceleratedCanvas: detectAcceleratedCanvas()
  };
  
  // Share this info globally for consistency
  window.deviceInfo = deviceInfo;
  
  /**
   * Detect if we're running on a low-end device
   */
  function detectLowEndDevice() {
    // Check for slow processors or limited memory
    const navigatorInfo = window.navigator || {};
    const deviceMemory = navigatorInfo.deviceMemory || 4; // Default to mid-range if not available
    
    // Check hardware concurrency (CPU cores)
    const hardwareConcurrency = navigatorInfo.hardwareConcurrency || 4; 
    
    // Performance navigation timing API can help detect slow devices
    const perfTiming = window.performance && window.performance.timing;
    const slowLoad = perfTiming ? 
      (perfTiming.domComplete - perfTiming.navigationStart > 3000) : false;
    
    return deviceMemory < 4 || hardwareConcurrency < 4 || slowLoad;
  }
  
  /**
   * Detect if canvas has hardware acceleration
   */
  function detectAcceleratedCanvas() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const accelerated = 
        !!(ctx && (ctx.getImageData || ctx.fillText || ctx.drawImage));
      return accelerated && !deviceInfo.isLowEndDevice;
    } catch (e) {
      return false;
    }
  }
  
  // Add coordination with touch controls
  function isTouchMode() {
    return deviceInfo.isMobile;
  }
  
  // Optimize grid drawing for touch screens (less detailed grid)
  function getGridDensity() {
    if (deviceInfo.isMobile) return 2; // Half density
    if (deviceInfo.isLowEndDevice) return 4; // Quarter density
    return 1; // Full density
  }
  
  // This is a memory optimization - pre-allocate a canvas for offscreen rendering
  let offscreenCanvas = null;
  let offscreenCtx = null;
  
  /**
   * Get or create an offscreen canvas for better performance
   */
  function getOffscreenCanvas(width, height) {
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCtx = offscreenCanvas.getContext('2d');
    }
    
    if (offscreenCanvas.width !== width) {
      offscreenCanvas.width = width;
    }
    
    if (offscreenCanvas.height !== height) {
      offscreenCanvas.height = height;
    }
    
    return offscreenCtx;
  }
  
  // Use a closure to avoid global namespace pollution
  
  // Pre-compute values that don't change frequently
  let lastTime = 0;
  const sinTable = new Float32Array(100); // Use typed array for better performance
  const sinTableSize = 100;
  
  // Initialize sin table for faster calculations
  for (let i = 0; i < sinTableSize; i++) {
    sinTable[i] = Math.sin(i / sinTableSize * Math.PI * 2);
  }
  
  // Reusable objects to avoid garbage collection
  const reusablePoint = { x: 0, y: 0 };
  let canvasContext = null;
  
  function getSinValue(index, amplitude) {
    // Get sin value from lookup table
    index = Math.floor(index % sinTableSize);
    if (index < 0) index += sinTableSize;
    return sinTable[index] * (amplitude || 1);
  }

  // Check for WebGL support to optimize rendering
  function supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  // Keep track if WebGL is supported
  const hasWebGL = supportsWebGL();
  
  // Force debug mode on
  const debugMode = true;
  
  // Public API
  return {
    // Fix initialization issues
    init: function(ctx) {
      if (!ctx) {
        console.error('Cannot initialize RenderUtils: No context provided');
        return;
      }
      
      console.log('RenderUtils initializing with canvas context');
      canvasContext = ctx;
      
      // Reset timing variables
      lastTime = 0;
      
      // Set canvas properties for better rendering
      ctx.canvas.style.display = 'block';
      ctx.imageSmoothingEnabled = false; // Sharper pixels
      
      // Force a solid background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Test draw a square to verify ctx is working
      if (debugMode) {
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 20, 20);
        ctx.fillStyle = 'green';
        ctx.fillRect(40, 10, 20, 20);
        ctx.fillStyle = 'blue';
        ctx.fillRect(70, 10, 20, 20);
        console.log('Test shapes drawn on canvas');
      }
      
      // Draw the RenderUtils version for debugging
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText('RenderUtils v1.1', 10, ctx.canvas.height - 5);
    },
    
    // Dramatically simplified snake drawing for debugging
    drawSnake: function(ctx, snake, cellSize) {
      if (!ctx) {
        console.error('Cannot draw snake: No context provided');
        return;
      }
      
      // Handle missing or invalid snake data
      if (!snake) {
        console.error('Cannot draw snake: Snake object is null');
        return;
      }
      
      if (!snake.body || !Array.isArray(snake.body) || snake.body.length === 0) {
        console.error('Cannot draw snake: Invalid snake body data', snake);
        
        // Try to recover if snake.segments exists but snake.body doesn't
        if (snake.segments && Array.isArray(snake.segments) && snake.segments.length > 0) {
          console.log('Recovering using snake.segments');
          snake.body = snake.segments.map(seg => ({ x: seg.x, y: seg.y }));
        } else {
          // Draw a placeholder snake for debugging
          ctx.fillStyle = 'red';
          ctx.fillRect(5 * cellSize, 5 * cellSize, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = 'white';
          ctx.strokeRect(5 * cellSize, 5 * cellSize, cellSize - 2, cellSize - 2);
          return;
        }
      }
      
      console.log(`Drawing snake with ${snake.body.length} segments at ${JSON.stringify(snake.body[0])}`);
      
      ctx.save();
      
      // Draw each segment with a simple, very visible approach
      for (let i = 0; i < snake.body.length; i++) {
        const segment = snake.body[i];
        const isHead = i === 0;
        
        if (typeof segment.x !== 'number' || typeof segment.y !== 'number') {
          console.error(`Invalid segment coordinates at index ${i}:`, segment);
          continue;
        }
        
        // Calculate position
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        
        // Use striking colors for visibility
        ctx.fillStyle = isHead ? '#FF2020' : (i % 2 === 0 ? '#20FF20' : '#50FF50');
        
        // Draw a simple rectangle for each segment
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Add white border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Mark head with an 'X'
        if (isHead) {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 5, y + 5);
          ctx.lineTo(x + cellSize - 5, y + cellSize - 5);
          ctx.moveTo(x + cellSize - 5, y + 5);
          ctx.lineTo(x + 5, y + cellSize - 5);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    },
    
    // Simplified food drawing
    drawFood: function(ctx, food, cellSize, time) {
      if (!ctx || !food) {
        console.error('Cannot draw food:', !ctx ? 'No context' : 'No food data');
        return;
      }
      
      // Food might use either gridX/gridY or x/y properties
      const foodX = typeof food.gridX !== 'undefined' ? food.gridX : food.x;
      const foodY = typeof food.gridY !== 'undefined' ? food.gridY : food.y;
      
      if (typeof foodX !== 'number' || typeof foodY !== 'number') {
        console.error('Invalid food coordinates:', food);
        return;
      }
      
      console.log(`Drawing food at x=${foodX}, y=${foodY}`);
      
      ctx.save();
      
      // Draw a very visible food item
      const x = foodX * cellSize;
      const y = foodY * cellSize;
      
      // Bright magenta square for high visibility
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      // Add border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      // Add pulsing effect
      const pulse = Math.sin(time / 200);
      const size = 3 + Math.abs(pulse) * 2;
      
      // Add a dot in the center
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + cellSize/2, y + cellSize/2, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    },
    
    // Fix grid drawing
    drawGrid: function(ctx, width, height, cellSize) {
      if (!ctx) return;
      
      ctx.save();
      
      // Clear background first
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      
      // Simplified grid for better visibility
      ctx.strokeStyle = 'rgba(50, 205, 50, 0.3)'; // Green grid
      ctx.lineWidth = 0.5;
      
      // Draw fewer grid lines for better performance
      const gridStep = Math.max(1, Math.floor(cellSize / 2)) * cellSize;
      
      // Draw vertical lines
      for (let x = 0; x <= width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw border
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);
      
      ctx.restore();
    },
    
    // Memory-optimized cleanup
    cleanup: function() {
      canvasContext = null;
      lastTime = 0;
      
      // Clear offscreen canvas resources
      if (offscreenCanvas) {
        offscreenCanvas.width = 1;
        offscreenCanvas.height = 1;
        offscreenCanvas = null;
        offscreenCtx = null;
      }
      
      if (this.gridCanvas) {
        this.gridCanvas.width = 1;
        this.gridCanvas.height = 1;
        this.gridCanvas = null;
      }
    },
    
    // Add method to create optimized touch graphics
    createTouchControls: function(ctx, width, height) {
      if (!deviceInfo.isMobile) return null;
      
      const touchCanvas = document.createElement('canvas');
      touchCanvas.width = width;
      touchCanvas.height = height;
      const touchCtx = touchCanvas.getContext('2d');
      
      // Draw touch-friendly indicators
      touchCtx.save();
      touchCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      touchCtx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      touchCtx.lineWidth = 2;
      
      // Draw swipe indicators (simplified)
      const arrowSize = Math.min(width, height) * 0.1;
      
      // Draw up arrow
      touchCtx.beginPath();
      touchCtx.moveTo(width/2, height*0.1);
      touchCtx.lineTo(width/2 - arrowSize/2, height*0.1 + arrowSize);
      touchCtx.lineTo(width/2 + arrowSize/2, height*0.1 + arrowSize);
      touchCtx.closePath();
      touchCtx.fill();
      touchCtx.stroke();
      
      // Draw right, down, left arrows...
      // ...
      
      touchCtx.restore();
      return touchCanvas;
    }
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = RenderUtils;
}
