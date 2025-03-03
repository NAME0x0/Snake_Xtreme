/**
 * Game enhancement module for Snake_Xtreme
 * Adds retro effects and improves player experience
 * With cross-browser compatibility improvements
 */

class GameEnhancement {
  constructor(gameContainer) {
    // Initialize with browser capability detection
    this.gameContainer = gameContainer || document.getElementById('game-container');
    this.particles = [];
    this.initialized = false;
    
    // Track resources for cleanup
    this.resources = {
      intervals: [],
      timeouts: [],
      frameIds: []
    };
    
    // Check browser capabilities
    this.capabilities = {
      webAudio: this.isAudioSupported(),
      webGL: this.isWebGLSupported(),
      animation: window.requestAnimationFrame !== undefined,
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
    
    // Initialize components
    this.setupRetroEffects();
    this.setupAudio();
    
    // Don't create duplicate UI elements if they already exist
    if (!document.querySelector('.score-display')) {
      this.setupUI();
    }
    
    this.initialized = true;
  }
  
  // Browser capability detection methods
  isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }
  
  // Add method to check if touch controls are available
  detectTouchControls() {
    return typeof TouchControls !== 'undefined';
  }
  
  setupRetroEffects() {
    try {
      // Check if effects already exist
      if (this.gameContainer.querySelector('.crt-effect')) {
        return;
      }
      
      // For touch devices, use lighter effects or none at all
      const isTouchFocused = this.capabilities.touchDevice && window.innerWidth < 800;
      
      // Add CRT effect overlay - skip on touch devices for better performance
      if (!isTouchFocused) {
        const crtEffect = document.createElement('div');
        crtEffect.className = 'crt-effect';
        this.gameContainer.appendChild(crtEffect);
        
        // Add scanlines effect
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        this.gameContainer.appendChild(scanlines);
        
        // Add slight screen flicker - use animation frame for performance
        if (this.capabilities.animation) {
          let flickerState = 1;
          const flickerThreshold = 0.97;
          
          const doFlicker = () => {
            if (Math.random() > flickerThreshold) {
              this.gameContainer.style.opacity = 0.9 + Math.random() * 0.1;
              flickerState = 0;
            } else if (flickerState === 0) {
              this.gameContainer.style.opacity = 1;
              flickerState = 1;
            }
            
            // Store the ID so we can cancel it later
            const frameId = requestAnimationFrame(doFlicker);
            this.resources.frameIds.push(frameId);
          };
          
          const frameId = requestAnimationFrame(doFlicker);
          this.resources.frameIds.push(frameId);
        }
      }
    } catch (e) {
      console.error('Error setting up retro effects:', e);
    }
  }
  
  setupUI() {
    try {
      // Create score display if it doesn't exist
      if (!document.querySelector('.score-display')) {
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display game-ui';
        this.scoreDisplay.textContent = 'SCORE: 0';
        this.gameContainer.appendChild(this.scoreDisplay);
      } else {
        this.scoreDisplay = document.querySelector('.score-display');
      }
    } catch (e) {
      console.error('Error setting up UI:', e);
    }
  }
  
  // Cross-browser compatible audio
  setupAudio() {
    try {
      // Check if Web Audio API is available
      if (this.capabilities.webAudio) {
        this.sounds = {
          move: this.createAudio('move', 0.2),
          eat: this.createAudio('eat', 0.3),
          gameOver: this.createAudio('gameOver', 0.5)
        };
      } else {
        // Fallback to simple audio elements if Web Audio API not supported
        this.sounds = {
          move: this.createFallbackAudio('move'),
          eat: this.createFallbackAudio('eat'),
          gameOver: this.createFallbackAudio('gameover')
        };
      }
    } catch (e) {
      // Create dummy sound objects if audio failed
      this.sounds = {
        move: { play: () => {} },
        eat: { play: () => {} },
        gameOver: { play: () => {} }
      };
      console.error('Error setting up audio:', e);
    }
  }
  
  /**
   * Improved audio handling for browser compatibility
   */

  // Add a unified audio context manager
  getAudioContext() {
    if (!this._audioContext) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this._audioContext = new AudioContextClass();
          
          // Unified approach to resume audio across all browsers
          const resumeAudioContext = () => {
            // Resume only if in suspended state
            if (this._audioContext && this._audioContext.state === "suspended") {
              this._audioContext.resume();
            }
          };
          
          // Handle both mouse and touch events for maximum compatibility
          const interactionEvents = ['mousedown', 'touchstart', 'keydown'];
          interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, resumeAudioContext, { once: false });
          });
        }
      } catch (e) {
        console.warn('Web Audio API not supported');
        this._audioContext = null;
      }
    }
    
    return this._audioContext;
  }
  
  // Replace createAudio method with this more robust version
  createAudio(name, volume) {
    return {
      play: () => {
        try {
          const audioContext = this.getAudioContext();
          if (!audioContext) return;
          
          // Create new nodes for each sound (prevents issues with reuse)
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          gainNode.gain.value = volume;
          
          switch(name) {
            case 'move':
              oscillator.type = 'square';
              oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
              oscillator.frequency.exponentialRampToValueAtTime(
                220, audioContext.currentTime + 0.1
              );
              gainNode.gain.exponentialRampToValueAtTime(
                0.01, audioContext.currentTime + 0.1
              );
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.1);
              break;
            case 'eat':
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
              oscillator.frequency.exponentialRampToValueAtTime(
                660, audioContext.currentTime + 0.1
              );
              gainNode.gain.exponentialRampToValueAtTime(
                0.01, audioContext.currentTime + 0.2
              );
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.2);
              break;
            case 'gameOver':
              oscillator.type = 'sawtooth';
              oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
              oscillator.frequency.exponentialRampToValueAtTime(
                110, audioContext.currentTime + 0.5
              );
              gainNode.gain.exponentialRampToValueAtTime(
                0.01, audioContext.currentTime + 0.5
              );
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.5);
              break;
          }
        } catch (e) {
          // Fallback to simple beep using Audio API if oscillator fails
          if (name === 'gameOver') {
            try {
              const fallbackAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10...");
              fallbackAudio.volume = Math.min(volume, 0.3);
              fallbackAudio.play().catch(e => console.warn('Could not play fallback audio'));
            } catch (e) {} // Silent fail for audio
          }
        }
      }
    };
  }
  
  createFallbackAudio(type) {
    // Create simple audio for browsers without Web Audio API
    // Use small, base64-encoded sounds or URLs to sound files
    const soundUrls = {
      move: 'data:audio/wav;base64,UklGRn9JAABXQVZFZm10IBAAAA',  // Empty base64 data - replace with actual encoded sounds
      eat: 'data:audio/wav;base64,UklGRn9JAABXQVZFZm10IBAAAA',
      gameover: 'data:audio/wav;base64,UklGRn9JAABXQVZFZm10IBAAAA'
    };

    return {
      play: () => {
        try {
          const sound = new Audio();
          sound.volume = type === 'move' ? 0.1 : type === 'eat' ? 0.2 : 0.3;
          sound.src = soundUrls[type] || '';
          
          // Avoid DOM pollution
          const playPromise = sound.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Auto cleanup when done
                setTimeout(() => sound.remove(), sound.duration * 1000 || 1000);
              })
              .catch(error => {
                // Auto-play was prevented - cleanup anyway
                sound.remove();
                console.log('Audio play prevented:', error);
              });
          }
        } catch (e) {
          console.error("Basic audio playback error:", e);
        }
      },
      cleanup: () => {} // Nothing to cleanup for fallback audio
    };
  }
  
  updateScore(score) {
    try {
      if (!this.scoreDisplay) return;
      
      this.scoreDisplay.textContent = `SCORE: ${score}`;
      // Add "glow" effect when score changes
      this.scoreDisplay.style.textShadow = '0 0 10px #32CD32';
      setTimeout(() => {
        this.scoreDisplay.style.textShadow = '2px 2px 0px rgba(0, 0, 0, 0.8)';
      }, 300);
    } catch (e) {
      console.error('Error updating score:', e);
    }
  }
  
  hideMessage() {
    try {
      // Helper method to hide messages
      const messages = document.querySelectorAll('.game-message');
      messages.forEach(msg => {
        if (msg.parentNode) {
          msg.parentNode.removeChild(msg);
        }
      });
    } catch (e) {
      console.error('Error hiding message:', e);
    }
  }
  
  createFoodParticles(x, y, cellSize) {
    try {
      // Limit maximum particles for performance
      const maxParticles = 200;
      
      if (this.particles.length > maxParticles) {
        // Remove oldest particles if we exceed the limit
        this.particles = this.particles.slice(-maxParticles/2);
      }
      
      const newParticles = RenderUtils.createFoodParticles(x, y, cellSize);
      this.particles.push(...newParticles);
      this.sounds.eat.play();
    } catch (e) {
      console.error('Error creating food particles:', e);
    }
  }
  
  updateParticles(ctx) {
    try {
      // Optimize particle rendering
      if (this.particles.length === 0) return;
      
      RenderUtils.updateParticles(ctx, this.particles);
    } catch (e) {
      console.error('Error updating particles:', e);
    }
  }
  
  playMoveSound() {
    try {
      // Only play move sound occasionally to avoid sound spam
      if (Math.random() > 0.7) {
        this.sounds.move.play();
      }
    } catch (e) {
      console.error('Error playing move sound:', e);
    }
  }
  
  playGameOverSound() {
    try {
      this.sounds.gameOver.play();
    } catch (e) {
      console.error('Error playing game over sound:', e);
    }
  }
  
  screenShake() {
    try {
      // Store original transform for restoration
      if (!this.gameContainer.dataset.originalTransform) {
        this.gameContainer.dataset.originalTransform = this.gameContainer.style.transform;
      }
      
      const originalTransform = this.gameContainer.dataset.originalTransform || 'translate(-50%, -50%)';
      
      // Apply shake
      this.gameContainer.style.transform = `${originalTransform} translate(${Math.random()*6-3}px, ${Math.random()*6-3}px)`;
      
      // Clean up after shake
      const shakeTimeout = setTimeout(() => {
        this.gameContainer.style.transform = originalTransform;
      }, 50);
      
      // Store timeout for cleanup
      this.resources.timeouts.push(shakeTimeout);
    } catch (e) {
      console.error('Error applying screen shake:', e);
    }
  }
  
  cleanup() {
    try {
      // Cancel flicker animation
      if (this.resources.frameIds.length > 0) {
        this.resources.frameIds.forEach(id => cancelAnimationFrame(id));
      }
      
      // Clear all intervals
      this.resources.intervals.forEach(id => clearInterval(id));
      
      // Clear all timeouts
      this.resources.timeouts.forEach(id => clearTimeout(id));
      
      // Reset container opacity
      if (this.gameContainer) {
        this.gameContainer.style.opacity = 1;
      }
      
      // Clear particles to free memory
      this.particles = [];
      
      // Cleanup audio contexts
      if (this.sounds) {
        Object.values(this.sounds).forEach(sound => {
          if (sound.cleanup) {
            sound.cleanup();
          }
        });
      }

      // Additional cleanup
      if (this._audioContext) {
        this._audioContext.close().catch(e => {});
        this._audioContext = null;
      }
      
      // Remove all child elements that were dynamically added
      const dynamicElements = Array.from(this.gameContainer.querySelectorAll(
        '.crt-effect, .scanlines, .score-display, .game-message'
      ));
      
      dynamicElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // Additional cleanup for better memory management
      if (RenderUtils && RenderUtils.cleanup) {
        RenderUtils.cleanup();
      }
      
      // Clear any global variables or references
      if (window.gameEnhancement === this) {
        window.gameEnhancement = null;
      }
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = GameEnhancement;
}
