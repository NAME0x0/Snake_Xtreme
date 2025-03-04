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
    // Better initialization with logging
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
    },
    
    // Make the snake much more visible for debugging
    drawSnake: function(ctx, snake, cellSize) {
      if (!ctx) {
        console.error('Cannot draw snake: No context provided');
        return;
      }
      
      if (!snake || !snake.body || snake.body.length === 0) {
        console.error('Cannot draw snake: Invalid snake data', snake);
        return;
      }
      
      console.log(`Drawing snake with ${snake.body.length} segments at ${JSON.stringify(snake.body[0])}`);
      
      // Save context state
      ctx.save();
      
      // Draw debug outline for game area
      if (debugMode) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      
      // Very visible snake segments
      for (let i = snake.body.length - 1; i >= 0; i--) {
        const segment = snake.body[i];
        const isHead = i === 0;
        
        // Verify segment coordinates
        if (segment.x === undefined || segment.y === undefined) {
          console.error(`Invalid segment at index ${i}:`, segment);
          continue;
        }
        
        // Calculate positions
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        
        // Log first and last segment positions
        if (i === 0 || i === snake.body.length - 1) {
          console.log(`Segment ${i}: x=${x}, y=${y}, gridX=${segment.x}, gridY=${segment.y}`);
        }
        
        // Fill with bright colors
        if (isHead) {
          ctx.fillStyle = '#FF2020'; // Bright red head
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#20FF20' : '#50FF50'; // Alternating green bodies
        }
        
        // Draw a solid rectangle for each segment
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Add segment border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Highlight the head with special marking
        if (isHead) {
          // Draw eyes based on direction
          const eyeSize = cellSize / 5;
          ctx.fillStyle = 'white';
          
          // Draw the eyes on the head
          let eyeX1, eyeX2, eyeY1, eyeY2;
          
          switch (snake.direction) {
            case 'UP':
              eyeX1 = x + cellSize / 3;
              eyeX2 = x + cellSize * 2/3;
              eyeY1 = eyeY2 = y + cellSize / 4;
              break;
            case 'DOWN':
              eyeX1 = x + cellSize / 3;
              eyeX2 = x + cellSize * 2/3;
              eyeY1 = eyeY2 = y + cellSize * 3/4;
              break;
            case 'LEFT':
              eyeX1 = eyeX2 = x + cellSize / 4;
              eyeY1 = y + cellSize / 3;
              eyeY2 = y + cellSize * 2/3;
              break;
            case 'RIGHT':
            default:
              eyeX1 = eyeX2 = x + cellSize * 3/4;
              eyeY1 = y + cellSize / 3;
              eyeY2 = y + cellSize * 2/3;
          }
          
          // Draw more visible eyes
          ctx.beginPath();
          ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
          ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Black pupils
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(eyeX1, eyeY1, eyeSize/2, 0, Math.PI * 2);
          ctx.arc(eyeX2, eyeY2, eyeSize/2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Restore context state
      ctx.restore();
    },
    
    // Make food very visible
    drawFood: function(ctx, food, cellSize, time) {
      if (!ctx || !food) {
        console.error('Cannot draw food:', !ctx ? 'No context' : 'No food data');
        return;
      }
      
      console.log(`Drawing food at x=${food.x}, y=${food.y}`);
      
      ctx.save();
      
      // Simple but very visible food
      const x = food.x * cellSize;
      const y = food.y * cellSize;
      
      // Draw a bright food item
      ctx.fillStyle = '#FF00FF'; // Magenta for high visibility
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      // Add a pulsing glow
      const pulseAmount = 0.5 + Math.sin(time / 200) * 0.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAmount})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSize, cellSize);
      
      ctx.restore();
    },
    
    // Draw a very clear grid for debugging
    drawGrid: function(ctx, width, height, cellSize) {
      if (!ctx) return;
      
      // Draw grid immediately for debugging purposes
      ctx.save();
      
      // Clear background first
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      
      // Draw numbered grid for debugging
      if (debugMode) {
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        for (let x = 0; x < width/cellSize; x++) {
          for (let y = 0; y < height/cellSize; y++) {
            ctx.fillText(`${x},${y}`, x * cellSize + 2, y * cellSize + 8);
          }
        }
      }
      
      // Draw main grid
      ctx.strokeStyle = 'rgba(50, 205, 50, 0.3)'; // Green grid
      ctx.lineWidth = 0.5;
      
      // Draw vertical lines
      for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw canvas border for debugging
      if (debugMode) {
        ctx.strokeStyle = '#FF5500';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
      }
      
      ctx.restore();
      
      console.log(`Grid drawn: ${width}×${height}, cellSize=${cellSize}`);
    },
    
    // Helper for drawing rounded rectangles - optimized and safer
    drawRoundRect: function(ctx, x, y, width, height, radius) {
      if (!ctx) return;
      
      // Ensure radius is not too large
      radius = Math.min(radius, width / 2, height / 2);
      
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
    },
    
    // Create particle effect when snake eats food - adjust for device capability
    createFoodParticles: function(x, y, cellSize) {
      // Detect device performance - use fewer particles on mobile or low-end devices
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isLowEndDevice = !hasWebGL || isMobile || window.devicePixelRatio < 1.5;
      
      const numParticles = isLowEndDevice ? 5 : (window.devicePixelRatio > 1) ? 15 : 10;
      const particles = [];
      
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * (isLowEndDevice ? 2 : 3);
        
        particles.push({
          x: x * cellSize + cellSize / 2,
          y: y * cellSize + cellSize / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          color: '#FF6347',
          life: isLowEndDevice ? 10 + Math.random() * 10 : 20 + Math.random() * 20
        });
      }
      
      return particles;
    },
    
    // Update and render particles - optimized batch rendering
    updateParticles: function(ctx, particles) {
      if (!ctx || !particles || particles.length === 0) return;
      
      // Skip rendering if too many particles for performance
      if (particles.length > 500) {
        // Just update positions and remove dead ones
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) {
            particles.splice(i, 1);
          }
        }
        return;
      }
      
      // Batch particles by color for better performance
      const particlesByColor = {};
      
      // Update positions and collect by color
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        if (!particlesByColor[p.color]) {
          particlesByColor[p.color] = [];
        }
        particlesByColor[p.color].push(p);
      }
      
      // Render particles by color (batch rendering)
      Object.keys(particlesByColor).forEach(color => {
        const colorParticles = particlesByColor[color];
        
        ctx.fillStyle = color;
        ctx.beginPath();
        
        colorParticles.forEach(p => {
          ctx.globalAlpha = p.life / 40;
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
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
