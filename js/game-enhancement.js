/**
 * Game enhancement module for Snake_Xtreme
 * Adds retro effects and improves player experience
 */

class GameEnhancement {
  constructor(gameContainer) {
    // Initialize enhancements
    this.gameContainer = gameContainer || document.getElementById('game-container');
    this.particles = [];
    this.setupRetroEffects();
    this.setupUI();
    this.setupAudio();
  }
  
  setupRetroEffects() {
    // Add CRT effect overlay
    const crtEffect = document.createElement('div');
    crtEffect.className = 'crt-effect';
    this.gameContainer.appendChild(crtEffect);
    
    // Add scanlines effect
    const scanlines = document.createElement('div');
    scanlines.className = 'scanlines';
    this.gameContainer.appendChild(scanlines);
    
    // Add slight screen flicker
    this.flickerInterval = setInterval(() => {
      this.gameContainer.style.opacity = Math.random() > 0.97 ? 
        0.9 + Math.random() * 0.1 : 1;
    }, 100);
  }
  
  setupUI() {
    // Create score display
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-display game-ui';
    this.scoreDisplay.textContent = 'SCORE: 0';
    this.gameContainer.appendChild(this.scoreDisplay);
    
    // Create message container for start/gameover
    this.messageDisplay = document.createElement('div');
    this.messageDisplay.className = 'game-message game-ui';
    this.messageDisplay.innerHTML = 'PRESS SPACE<br>TO START';
    this.messageDisplay.style.display = 'block';
    this.gameContainer.appendChild(this.messageDisplay);
  }
  
  setupAudio() {
    // Create audio elements for retro sounds
    this.sounds = {
      move: this.createAudio('move', 0.2),
      eat: this.createAudio('eat', 0.3),
      gameOver: this.createAudio('gameOver', 0.5)
    };
  }
  
  createAudio(name, volume) {
    // Generate retro sound effects using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return {
      play: () => {
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
      }
    };
  }
  
  updateScore(score) {
    this.scoreDisplay.textContent = `SCORE: ${score}`;
    // Add "glow" effect when score changes
    this.scoreDisplay.style.textShadow = '0 0 10px #32CD32';
    setTimeout(() => {
      this.scoreDisplay.style.textShadow = '2px 2px 0px rgba(0, 0, 0, 0.8)';
    }, 300);
  }
  
  showMessage(message, callback) {
    this.messageDisplay.innerHTML = message;
    this.messageDisplay.style.display = 'block';
    
    if (callback) {
      const handleKeyPress = (e) => {
        if (e.code === 'Space') {
          document.removeEventListener('keydown', handleKeyPress);
          this.messageDisplay.style.display = 'none';
          callback();
        }
      };
      document.addEventListener('keydown', handleKeyPress);
    }
  }
  
  hideMessage() {
    this.messageDisplay.style.display = 'none';
  }
  
  createFoodParticles(x, y, cellSize) {
    const newParticles = RenderUtils.createFoodParticles(x, y, cellSize);
    this.particles.push(...newParticles);
    this.sounds.eat.play();
  }
  
  updateParticles(ctx) {
    RenderUtils.updateParticles(ctx, this.particles);
  }
  
  playMoveSound() {
    // Only play move sound occasionally to avoid sound spam
    if (Math.random() > 0.7) {
      this.sounds.move.play();
    }
  }
  
  playGameOverSound() {
    this.sounds.gameOver.play();
  }
  
  screenShake() {
    // Simple screen shake effect
    const originalTransform = this.gameContainer.style.transform;
    this.gameContainer.style.transform = `translate(-50%, -50%) translate(${Math.random()*6-3}px, ${Math.random()*6-3}px)`;
    
    setTimeout(() => {
      this.gameContainer.style.transform = originalTransform;
    }, 50);
  }
  
  cleanup() {
    if (this.flickerInterval) {
      clearInterval(this.flickerInterval);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = GameEnhancement;
}
