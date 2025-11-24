import { Multiplier, RiskLevel } from './types';

// The colors for the multipliers based on difficulty
const COLORS = {
  easy: '#f59e0b', // Amber
  medium: '#f97316', // Orange
  hard: '#ef4444', // Red
  extreme: '#dc2626', // Dark Red
};

// Procedural generation of multipliers to simulate the curve
// In a real app, these would be static mapped arrays for perfect balance.
// We will use standard "Stake-like" presets for 8, 12, and 16 rows.

export const MULTIPLIERS: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    [RiskLevel.LOW]: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    [RiskLevel.MEDIUM]: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    [RiskLevel.HIGH]: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    [RiskLevel.LOW]: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    [RiskLevel.MEDIUM]: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    [RiskLevel.HIGH]: [170, 51, 14, 5.3, 2.1, 0.5, 0.2, 0.5, 2.1, 5.3, 14, 51, 170],
  },
  16: {
    [RiskLevel.LOW]: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    [RiskLevel.MEDIUM]: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    [RiskLevel.HIGH]: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  }
};

export const getMultipliers = (rows: number, risk: RiskLevel): Multiplier[] => {
  const values = MULTIPLIERS[rows][risk];
  const centerIndex = Math.floor(values.length / 2);
  
  return values.map((val, idx) => {
    const distFromCenter = Math.abs(idx - centerIndex);
    // Interpolate color based on distance from center (riskier = redder)
    let color = COLORS.easy;
    if (distFromCenter > rows * 0.35) color = COLORS.medium;
    if (distFromCenter > rows * 0.45) color = COLORS.hard;
    if (distFromCenter === centerIndex && val < 1) color = '#eab308'; // Center loss is yellowish

    return {
      label: `${val}x`,
      value: val,
      color: hexToRgb(color), // Just return the RGB numbers string so Canvas can use rgba()
    };
  });
};

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}