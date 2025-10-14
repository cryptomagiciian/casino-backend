// Scene assets for Leverage Ladder
import * as PIXI from 'pixi.js';

export interface CandleData {
  level: number;
  color: number;
  glowColor: number;
  bodyHeight: number;
  wickHeight: number;
}

export interface MilestoneData {
  level: number;
  multiplier: number;
  color: number;
  label: string;
}

// Color scheme matching the poster
export const COLORS = {
  // Background
  skyGradient: {
    top: 0x071228,    // Deep navy
    bottom: 0x0E1F3A  // Lighter navy
  },
  
  // Candlestick colors by level
  candleColors: {
    green: 0x21E39E,   // Levels 1-3
    cyan: 0x00C2FF,    // Levels 4-6  
    purple: 0x9A2EFF,  // Levels 7-9
    gold: 0xFFE26B     // Level 10+
  },
  
  // Milestone colors
  milestoneColors: {
    '2x': 0x61FFE8,    // Cyan
    '5x': 0xFF9AF6,    // Pink
    '10x': 0xFFE26B    // Gold
  },
  
  // UI colors
  climbButton: {
    start: 0x1DE9B6,
    end: 0x00C2FF
  },
  
  cashoutButton: {
    start: 0xFF9A2E,
    end: 0xFF4D6D
  },
  
  // Risk meter
  riskMeter: {
    low: 0x21E39E,     // Green
    medium: 0xFFC343,  // Orange
    high: 0xFF4D6D     // Red
  },
  
  // Flame colors
  flameColors: {
    inner: 0xFF6A00,
    outer: 0xFFB000
  }
};

// Generate candlestick data for each level
export function generateCandleData(level: number): CandleData {
  let color: number;
  let glowColor: number;
  
  if (level <= 3) {
    color = COLORS.candleColors.green;
    glowColor = COLORS.candleColors.green;
  } else if (level <= 6) {
    color = COLORS.candleColors.cyan;
    glowColor = COLORS.candleColors.cyan;
  } else if (level <= 9) {
    color = COLORS.candleColors.purple;
    glowColor = COLORS.candleColors.purple;
  } else {
    color = COLORS.candleColors.gold;
    glowColor = COLORS.candleColors.gold;
  }
  
  return {
    level,
    color,
    glowColor,
    bodyHeight: 20 + (level * 2), // Slightly taller for higher levels
    wickHeight: 8 + (level * 1)
  };
}

// Generate milestone data
export function generateMilestones(): MilestoneData[] {
  return [
    { level: 2, multiplier: 2, color: COLORS.milestoneColors['2x'], label: '2×' },
    { level: 5, multiplier: 5, color: COLORS.milestoneColors['5x'], label: '5×' },
    { level: 10, multiplier: 10, color: COLORS.milestoneColors['10x'], label: '10×' }
  ];
}

// Create a candlestick graphics object
export function createCandlestick(candleData: CandleData, width: number = 40): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  
  // Candle body
  graphics.beginFill(candleData.color);
  graphics.drawRect(-width/2, -candleData.bodyHeight/2, width, candleData.bodyHeight);
  graphics.endFill();
  
  // Top wick
  graphics.lineStyle(2, candleData.color);
  graphics.moveTo(0, -candleData.bodyHeight/2);
  graphics.lineTo(0, -candleData.bodyHeight/2 - candleData.wickHeight);
  
  // Bottom wick
  graphics.moveTo(0, candleData.bodyHeight/2);
  graphics.lineTo(0, candleData.bodyHeight/2 + candleData.wickHeight);
  
  // Add glow effect
  const glow = new PIXI.Graphics();
  glow.beginFill(candleData.glowColor, 0.45);
  glow.drawRect(-width/2 - 6, -candleData.bodyHeight/2 - 6, width + 12, candleData.bodyHeight + 12);
  glow.endFill();
  glow.filters = [new PIXI.BlurFilter(8)];
  
  const container = new PIXI.Container();
  container.addChild(glow);
  container.addChild(graphics);
  
  return container as any;
}

// Create milestone label
export function createMilestoneLabel(milestone: MilestoneData): PIXI.Text {
  const style = new PIXI.TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: '800',
    fill: milestone.color,
    letterSpacing: -1,
    dropShadow: true,
    dropShadowColor: milestone.color,
    dropShadowBlur: 8,
    dropShadowAngle: Math.PI / 4,
    dropShadowDistance: 2
  });
  
  const text = new PIXI.Text(milestone.label, style);
  text.anchor.set(0.5);
  
  return text;
}

// Create moon sprite
export function createMoon(): PIXI.Graphics {
  const moon = new PIXI.Graphics();
  
  // Main moon body
  moon.beginFill(0xE6F3FF, 0.9);
  moon.drawCircle(0, 0, 60);
  moon.endFill();
  
  // Moon craters
  moon.beginFill(0xC4D9E8, 0.6);
  moon.drawCircle(-15, -10, 8);
  moon.drawCircle(10, 5, 5);
  moon.drawCircle(-5, 15, 6);
  moon.endFill();
  
  // Glow effect
  const glow = new PIXI.Graphics();
  glow.beginFill(0xE6F3FF, 0.3);
  glow.drawCircle(0, 0, 80);
  glow.endFill();
  glow.filters = [new PIXI.BlurFilter(15)];
  
  const container = new PIXI.Container();
  container.addChild(glow);
  container.addChild(moon);
  
  return container as any;
}

// Create flame graphics
export function createFlame(width: number, height: number): PIXI.Graphics {
  const flame = new PIXI.Graphics();
  
  // Flame body with gradient effect
  const gradient = new PIXI.Graphics();
  gradient.beginFill(COLORS.flameColors.inner);
  gradient.drawEllipse(0, height/2, width/2, height/2);
  gradient.endFill();
  
  // Flame tip
  gradient.beginFill(COLORS.flameColors.outer);
  gradient.drawEllipse(0, 0, width/3, height/3);
  gradient.endFill();
  
  // Add glow
  const glow = new PIXI.Graphics();
  glow.beginFill(COLORS.flameColors.outer, 0.4);
  glow.drawEllipse(0, height/2, width/2 + 10, height/2 + 10);
  glow.endFill();
  glow.filters = [new PIXI.BlurFilter(12)];
  
  const container = new PIXI.Container();
  container.addChild(glow);
  container.addChild(gradient);
  
  return container as any;
}

// Create lightning bolt
export function createLightning(): PIXI.Graphics {
  const lightning = new PIXI.Graphics();
  
  lightning.lineStyle(4, 0x00C2FF, 1);
  lightning.moveTo(0, 0);
  lightning.lineTo(-20, 30);
  lightning.lineTo(10, 50);
  lightning.lineTo(-10, 80);
  lightning.lineTo(15, 100);
  lightning.lineTo(-5, 130);
  lightning.lineTo(20, 150);
  
  // Add glow
  const glow = new PIXI.Graphics();
  glow.lineStyle(8, 0x00C2FF, 0.6);
  glow.moveTo(0, 0);
  glow.lineTo(-20, 30);
  glow.lineTo(10, 50);
  glow.lineTo(-10, 80);
  glow.lineTo(15, 100);
  glow.lineTo(-5, 130);
  glow.lineTo(20, 150);
  glow.filters = [new PIXI.BlurFilter(6)];
  
  const container = new PIXI.Container();
  container.addChild(glow);
  container.addChild(lightning);
  
  return container as any;
}

// Create star field
export function createStarField(width: number, height: number): PIXI.Graphics {
  const stars = new PIXI.Graphics();
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.6; // Only in upper 60% of screen
    const size = Math.random() * 2 + 1;
    
    stars.beginFill(0xFFFFFF, Math.random() * 0.8 + 0.2);
    stars.drawCircle(x, y, size);
    stars.endFill();
  }
  
  return stars;
}
