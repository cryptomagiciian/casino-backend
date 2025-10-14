// Effects system for Leverage Ladder animations
import * as PIXI from 'pixi.js';

export interface AnimationConfig {
  duration: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

// Easing functions
export const EASING = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// Generic animation system
export class AnimationManager {
  private animations: Map<string, AnimationConfig & { startTime: number; target: any; property: string; startValue: any; endValue: any }> = new Map();
  private rafId: number | null = null;

  animate(target: any, property: string, endValue: any, config: AnimationConfig): void {
    const key = `${target.constructor.name}_${property}`;
    const startValue = target[property];
    const startTime = performance.now();

    this.animations.set(key, {
      ...config,
      startTime,
      target,
      property,
      startValue,
      endValue
    });

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.update.bind(this));
    }
  }

  private update(currentTime: number): void {
    const toRemove: string[] = [];

    for (const [key, animation] of this.animations) {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      
      const easing = animation.easing || EASING.easeOutCubic;
      const easedProgress = easing(progress);
      
      const currentValue = animation.startValue + (animation.endValue - animation.startValue) * easedProgress;
      animation.target[animation.property] = currentValue;

      if (progress >= 1) {
        animation.target[animation.property] = animation.endValue;
        if (animation.onComplete) {
          animation.onComplete();
        }
        toRemove.push(key);
      }
    }

    toRemove.forEach(key => this.animations.delete(key));

    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(this.update.bind(this));
    } else {
      this.rafId = null;
    }
  }

  stop(target: any, property: string): void {
    const key = `${target.constructor.name}_${property}`;
    this.animations.delete(key);
  }

  stopAll(): void {
    this.animations.clear();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Pulse effect for milestones
export function createPulseEffect(target: PIXI.DisplayObject, scale: number = 1.2, duration: number = 600): void {
  const originalScale = target.scale.x;
  
  // Scale up
  const scaleUp = () => {
    target.scale.set(scale);
  };
  
  // Scale down
  const scaleDown = () => {
    target.scale.set(originalScale);
  };
  
  // Ring effect
  const ring = new PIXI.Graphics();
  ring.lineStyle(3, 0xFFFFFF, 0.8);
  ring.drawCircle(0, 0, 20);
  ring.filters = [new PIXI.BlurFilter(4)];
  target.parent?.addChild(ring);
  ring.position.copyFrom(target.position);
  
  // Animate ring expansion
  const ringAnimation = () => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const scale = 1 + progress * 3;
        const alpha = 1 - progress;
        ring.scale.set(scale);
        ring.alpha = alpha;
        requestAnimationFrame(animate);
      } else {
        target.parent?.removeChild(ring);
      }
    };
    requestAnimationFrame(animate);
  };
  
  // Execute effects
  scaleUp();
  ringAnimation();
  
  setTimeout(() => {
    scaleDown();
  }, duration / 2);
}

// Particle burst effect
export function createParticleBurst(
  container: PIXI.Container, 
  x: number, 
  y: number, 
  color: number = 0xFFD700, 
  count: number = 20
): void {
  for (let i = 0; i < count; i++) {
    const particle = new PIXI.Graphics();
    particle.beginFill(color, 0.8);
    particle.drawCircle(0, 0, Math.random() * 4 + 2);
    particle.endFill();
    
    particle.x = x;
    particle.y = y;
    container.addChild(particle);
    
    // Random velocity
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = Math.random() * 200 + 100;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 50; // Slight upward bias
    
    // Animate particle
    const startTime = performance.now();
    const duration = 1000 + Math.random() * 500;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        particle.x += vx * 0.016; // Assuming 60fps
        particle.y += vy * 0.016;
        particle.alpha = 1 - progress;
        particle.scale.set(1 - progress * 0.5);
        
        // Gravity
        vy += 200 * 0.016;
        
        requestAnimationFrame(animate);
      } else {
        container.removeChild(particle);
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Screen flash effect
export function createScreenFlash(container: PIXI.Container, color: number = 0xFFFFFF, duration: number = 200): void {
  const flash = new PIXI.Graphics();
  flash.beginFill(color, 0.8);
  flash.drawRect(0, 0, container.width, container.height);
  flash.endFill();
  
  container.addChild(flash);
  
  const startTime = performance.now();
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = elapsed / duration;
    
    if (progress < 1) {
      flash.alpha = 1 - progress;
      requestAnimationFrame(animate);
    } else {
      container.removeChild(flash);
    }
  };
  
  requestAnimationFrame(animate);
}

// Shake effect
export function createShakeEffect(target: PIXI.DisplayObject, intensity: number = 5, duration: number = 300): void {
  const originalX = target.x;
  const originalY = target.y;
  
  const startTime = performance.now();
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = elapsed / duration;
    
    if (progress < 1) {
      const shakeIntensity = intensity * (1 - progress);
      target.x = originalX + (Math.random() - 0.5) * shakeIntensity;
      target.y = originalY + (Math.random() - 0.5) * shakeIntensity;
      requestAnimationFrame(animate);
    } else {
      target.x = originalX;
      target.y = originalY;
    }
  };
  
  requestAnimationFrame(animate);
}

// Camera pan effect
export function createCameraPan(
  camera: PIXI.Container, 
  deltaY: number, 
  duration: number = 400,
  easing: (t: number) => number = EASING.easeOutCubic
): void {
  const startY = camera.y;
  const endY = startY + deltaY;
  
  const startTime = performance.now();
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easedProgress = easing(progress);
    camera.y = startY + (endY - startY) * easedProgress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
}

// Liquidation sequence
export function createLiquidationSequence(
  container: PIXI.Container,
  avatar: PIXI.DisplayObject,
  ladder: PIXI.Container,
  flames: PIXI.DisplayObject
): void {
  // 1. Lightning strike
  const lightning = new PIXI.Graphics();
  lightning.lineStyle(6, 0x00C2FF, 1);
  lightning.moveTo(avatar.x + 50, 0);
  lightning.lineTo(avatar.x, avatar.y);
  lightning.filters = [new PIXI.BlurFilter(4)];
  
  container.addChild(lightning);
  
  // 2. Screen flash
  setTimeout(() => {
    createScreenFlash(container, 0xFFFFFF, 150);
  }, 100);
  
  // 3. Ladder collapse
  setTimeout(() => {
    // Animate ladder segments falling
    ladder.children.forEach((segment, index) => {
      const delay = index * 50;
      setTimeout(() => {
        const startY = segment.y;
        const animate = (currentTime: number) => {
          const elapsed = currentTime - (performance.now() - delay);
          const progress = Math.min(elapsed / 800, 1);
          
          segment.y = startY + progress * 1000;
          segment.rotation = progress * Math.PI * 2;
          segment.alpha = 1 - progress;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }, delay);
    });
  }, 200);
  
  // 4. Flames surge
  setTimeout(() => {
    const originalScale = flames.scale.y;
    flames.scale.y = originalScale * 1.5;
    flames.alpha = 1.2;
    
    setTimeout(() => {
      flames.scale.y = originalScale;
      flames.alpha = 1;
    }, 600);
  }, 300);
  
  // 5. Remove lightning
  setTimeout(() => {
    container.removeChild(lightning);
  }, 1000);
}

// Cashout celebration
export function createCashoutCelebration(
  container: PIXI.Container,
  x: number,
  y: number
): void {
  // Particle burst
  createParticleBurst(container, x, y, 0xFFD700, 30);
  
  // Success text
  const successText = new PIXI.Text('PROFIT SECURED', new PIXI.TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 32,
    fontWeight: 'bold',
    fill: 0x00FF00,
    dropShadow: true,
    dropShadowColor: 0x00FF00,
    dropShadowBlur: 8
  }));
  
  successText.anchor.set(0.5);
  successText.x = x;
  successText.y = y - 50;
  container.addChild(successText);
  
  // Animate text
  const startTime = performance.now();
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = elapsed / 2000;
    
    if (progress < 1) {
      successText.alpha = 1 - progress;
      successText.scale.set(1 + progress * 0.5);
      requestAnimationFrame(animate);
    } else {
      container.removeChild(successText);
    }
  };
  
  requestAnimationFrame(animate);
}
