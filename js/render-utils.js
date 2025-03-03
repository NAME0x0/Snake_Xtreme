/**
 * Enhanced rendering utilities for Snake_Xtreme
 */

const RenderUtils = {
  // Draw snake segments with improved visibility and style
  drawSnake: function(ctx, snake, cellSize) {
    ctx.save();
    
    // Draw body segments
    for (let i = snake.body.length - 1; i >= 0; i--) {
      const segment = snake.body[i];
      const isHead = i === 0;
      
      ctx.fillStyle = isHead ? '#7FFF00' : '#32CD32';
      
      // Add segment effect
      const offsetX = isHead ? 0 : Math.sin(Date.now() / 200 + i) * 0.5;
      
      // Round corners for body segments
      this.drawRoundRect(
        ctx, 
        segment.x * cellSize + offsetX, 
        segment.y * cellSize, 
        cellSize - 2, 
        cellSize - 2, 
        isHead ? 4 : 2
      );
      
      // Add eyes for the head
      if (isHead) {
        ctx.fillStyle = 'black';
        
        // Direction-based eyes
        const eyeSize = cellSize / 6;
        let eyeX1, eyeX2, eyeY1, eyeY2;
        
        switch (snake.direction) {
          case 'UP':
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + cellSize * 2/3;
            eyeY1 = eyeY2 = segment.y * cellSize + cellSize / 3;
            break;
          case 'DOWN':
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + cellSize * 2/3;
            eyeY1 = eyeY2 = segment.y * cellSize + cellSize * 2/3;
            break;
          case 'LEFT':
            eyeX1 = eyeX2 = segment.x * cellSize + cellSize / 3;
            eyeY1 = segment.y * cellSize + cellSize / 3;
            eyeY2 = segment.y * cellSize + cellSize * 2/3;
            break;
          case 'RIGHT':
          default:
            eyeX1 = eyeX2 = segment.x * cellSize + cellSize * 2/3;
            eyeY1 = segment.y * cellSize + cellSize / 3;
            eyeY2 = segment.y * cellSize + cellSize * 2/3;
            break;
        }
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  },
  
  // Draw pulsating food with retro effect
  drawFood: function(ctx, food, cellSize, time) {
    ctx.save();
    
    const pulseFactor = 1 + Math.sin(time / 300) * 0.1;
    const adjustedSize = cellSize * pulseFactor;
    const offset = (adjustedSize - cellSize) / 2;
    
    ctx.fillStyle = '#FF6347';
    
    // Star shape for food
    const centerX = food.x * cellSize + cellSize / 2;
    const centerY = food.y * cellSize + cellSize / 2;
    const spikes = 5;
    const outerRadius = adjustedSize / 2;
    const innerRadius = adjustedSize / 4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = Math.PI / spikes * i;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  },
  
  // Draw game grid with retro fading effect
  drawGrid: function(ctx, width, height, cellSize) {
    ctx.save();
    ctx.strokeStyle = 'rgba(50, 205, 50, 0.2)';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  },
  
  // Helper for drawing rounded rectangles
  drawRoundRect: function(ctx, x, y, width, height, radius) {
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
  
  // Create particle effect when snake eats food
  createFoodParticles: function(x, y, cellSize) {
    const particles = [];
    const numParticles = 15;
    
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      
      particles.push({
        x: x * cellSize + cellSize / 2,
        y: y * cellSize + cellSize / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: '#FF6347',
        life: 20 + Math.random() * 20
      });
    }
    
    return particles;
  },
  
  // Update and render particles
  updateParticles: function(ctx, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = RenderUtils;
}
