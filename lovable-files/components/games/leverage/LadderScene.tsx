import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import { 
  generateCandleData, 
  generateMilestones, 
  createCandlestick, 
  createMilestoneLabel, 
  createMoon, 
  createFlame, 
  createLightning,
  createStarField,
  COLORS 
} from '../../../lib/ladder/sceneAssets';
import { 
  AnimationManager, 
  createPulseEffect, 
  createParticleBurst, 
  createScreenFlash, 
  createShakeEffect, 
  createCameraPan, 
  createLiquidationSequence, 
  createCashoutCelebration,
  EASING 
} from '../../../lib/ladder/effects';

interface LadderSceneProps {
  currentLevel: number;
  multiplier: number;
  risk: number; // 0-100
  milestones?: number[];
  onMilestoneReached?: (milestone: number) => void;
}

export interface LadderSceneRef {
  animateAdvance: () => void;
  animateLiquidation: () => void;
  animateCashout: () => void;
  updateRisk: (risk: number) => void;
}

const LadderScene = forwardRef<LadderSceneRef, LadderSceneProps>(({
  currentLevel,
  multiplier,
  risk,
  milestones = [2, 5, 10],
  onMilestoneReached
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const sceneRef = useRef<PIXI.Container | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  
  // Scene elements
  const backgroundRef = useRef<PIXI.Container | null>(null);
  const starFieldRef = useRef<PIXI.Graphics | null>(null);
  const moonRef = useRef<PIXI.Graphics | null>(null);
  const ladderRef = useRef<PIXI.Container | null>(null);
  const flamesRef = useRef<PIXI.Graphics | null>(null);
  const avatarRef = useRef<PIXI.Graphics | null>(null);
  const milestoneLabelsRef = useRef<PIXI.Text[]>([]);
  
  // Animation state
  const cameraRef = useRef<PIXI.Container | null>(null);
  const isAnimatingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    animateAdvance: () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      
      // Check for milestone
      const milestoneData = generateMilestones();
      const reachedMilestone = milestoneData.find(m => m.level === currentLevel);
      
      if (reachedMilestone) {
        const milestoneLabel = milestoneLabelsRef.current.find(label => 
          label.text === reachedMilestone.label
        );
        if (milestoneLabel) {
          createPulseEffect(milestoneLabel);
          onMilestoneReached?.(reachedMilestone.multiplier);
        }
      }
      
      // Camera pan up
      createCameraPan(cameraRef.current!, -40, 400, EASING.easeOutCubic);
      
      // Move avatar up
      if (avatarRef.current) {
        const newY = avatarRef.current.y - 60;
        animationManagerRef.current?.animate(avatarRef.current, 'y', newY, {
          duration: 400,
          easing: EASING.easeOutBounce
        });
      }
      
      // Add next rung with materialization effect
      setTimeout(() => {
        addNextRung();
        isAnimatingRef.current = false;
      }, 250);
    },
    
    animateLiquidation: () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      
      createLiquidationSequence(
        sceneRef.current!,
        avatarRef.current!,
        ladderRef.current!,
        flamesRef.current!
      );
      
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 2000);
    },
    
    animateCashout: () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      
      if (avatarRef.current) {
        createCashoutCelebration(
          sceneRef.current!,
          avatarRef.current.x,
          avatarRef.current.y
        );
      }
      
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 2000);
    },
    
    updateRisk: (newRisk: number) => {
      updateFlameHeight(newRisk);
    }
  }));

  // Initialize PIXI app
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      view: canvasRef.current,
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    appRef.current = app;
    animationManagerRef.current = new AnimationManager();

    // Create main scene container
    const scene = new PIXI.Container();
    sceneRef.current = scene;
    app.stage.addChild(scene);

    // Create camera container for panning
    const camera = new PIXI.Container();
    cameraRef.current = camera;
    scene.addChild(camera);

    // Create background
    createBackground();
    
    // Create star field
    createStars();
    
    // Create moon
    createMoonElement();
    
    // Create flames
    createFlames();
    
    // Create ladder
    createLadder();
    
    // Create avatar
    createAvatar();
    
    // Create milestone labels
    createMilestoneLabels();

    // Start idle animations
    startIdleAnimations();

    return () => {
      app.destroy(true);
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!appRef.current || !canvasRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (!container) return;
      
      const { clientWidth, clientHeight } = container;
      appRef.current.renderer.resize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update risk when it changes
  useEffect(() => {
    updateFlameHeight(risk);
  }, [risk]);

  const createBackground = () => {
    const background = new PIXI.Graphics();
    backgroundRef.current = background;
    
    // Sky gradient
    const gradient = new PIXI.Graphics();
    gradient.beginFill(COLORS.skyGradient.top);
    gradient.drawRect(0, 0, appRef.current!.screen.width, appRef.current!.screen.height);
    gradient.endFill();
    
    // Add gradient effect (simplified)
    const bottomGradient = new PIXI.Graphics();
    bottomGradient.beginFill(COLORS.skyGradient.bottom, 0.7);
    bottomGradient.drawRect(0, appRef.current!.screen.height * 0.6, appRef.current!.screen.width, appRef.current!.screen.height * 0.4);
    bottomGradient.endFill();
    
    background.addChild(gradient);
    background.addChild(bottomGradient);
    cameraRef.current!.addChild(background);
  };

  const createStars = () => {
    const stars = createStarField(appRef.current!.screen.width, appRef.current!.screen.height);
    starFieldRef.current = stars;
    cameraRef.current!.addChild(stars);
  };

  const createMoonElement = () => {
    const moon = createMoon();
    moonRef.current = moon;
    moon.x = appRef.current!.screen.width * 0.8;
    moon.y = appRef.current!.screen.height * 0.2;
    cameraRef.current!.addChild(moon);
  };

  const createFlames = () => {
    const flames = createFlame(200, 100);
    flamesRef.current = flames;
    flames.x = appRef.current!.screen.width / 2;
    flames.y = appRef.current!.screen.height - 50;
    cameraRef.current!.addChild(flames);
  };

  const createLadder = () => {
    const ladder = new PIXI.Container();
    ladderRef.current = ladder;
    ladder.x = appRef.current!.screen.width / 2;
    ladder.y = appRef.current!.screen.height - 200;
    cameraRef.current!.addChild(ladder);

    // Create initial rungs
    for (let level = 1; level <= currentLevel; level++) {
      addRung(level);
    }
  };

  const addRung = (level: number) => {
    if (!ladderRef.current) return;
    
    const candleData = generateCandleData(level);
    const candlestick = createCandlestick(candleData);
    
    candlestick.y = -(level - 1) * 60;
    ladderRef.current.addChild(candlestick);
  };

  const addNextRung = () => {
    const nextLevel = currentLevel + 1;
    addRung(nextLevel);
  };

  const createAvatar = () => {
    const avatar = new PIXI.Graphics();
    avatar.beginFill(0xFFD700, 0.9);
    avatar.drawCircle(0, 0, 8);
    avatar.endFill();
    
    // Add glow
    const glow = new PIXI.Graphics();
    glow.beginFill(0xFFD700, 0.4);
    glow.drawCircle(0, 0, 12);
    glow.endFill();
    glow.filters = [new PIXI.BlurFilter(4)];
    
    const container = new PIXI.Container();
    container.addChild(glow);
    container.addChild(avatar);
    
    avatarRef.current = container as any;
    avatarRef.current.x = 0;
    avatarRef.current.y = -(currentLevel - 1) * 60;
    ladderRef.current!.addChild(avatarRef.current);
  };

  const createMilestoneLabels = () => {
    const milestoneData = generateMilestones();
    
    milestoneData.forEach(milestone => {
      const label = createMilestoneLabel(milestone);
      label.x = appRef.current!.screen.width / 2 + 80;
      label.y = appRef.current!.screen.height - 200 - (milestone.level - 1) * 60;
      
      milestoneLabelsRef.current.push(label);
      cameraRef.current!.addChild(label);
    });
  };

  const updateFlameHeight = (riskLevel: number) => {
    if (!flamesRef.current) return;
    
    const baseHeight = 100;
    const maxHeight = 200;
    const newHeight = baseHeight + (riskLevel / 100) * (maxHeight - baseHeight);
    
    flamesRef.current.scale.y = newHeight / 100;
  };

  const startIdleAnimations = () => {
    // Moon parallax
    if (moonRef.current) {
      const animateMoon = () => {
        const time = Date.now() * 0.0001;
        moonRef.current!.x = appRef.current!.screen.width * 0.8 + Math.sin(time) * 10;
        moonRef.current!.y = appRef.current!.screen.height * 0.2 + Math.cos(time * 0.7) * 5;
        requestAnimationFrame(animateMoon);
      };
      animateMoon();
    }
    
    // Star twinkle
    if (starFieldRef.current) {
      const animateStars = () => {
        const time = Date.now() * 0.002;
        starFieldRef.current!.children.forEach((star, index) => {
          star.alpha = 0.3 + Math.sin(time + index) * 0.4;
        });
        requestAnimationFrame(animateStars);
      };
      animateStars();
    }
    
    // Subtle camera sway
    if (cameraRef.current) {
      const animateCamera = () => {
        const time = Date.now() * 0.0005;
        cameraRef.current!.x = Math.sin(time) * 2;
        requestAnimationFrame(animateCamera);
      };
      animateCamera();
    }
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
});

LadderScene.displayName = 'LadderScene';

export default LadderScene;
