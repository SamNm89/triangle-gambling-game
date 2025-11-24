export interface Point {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number; // Bet amount
  targetPath: number[]; // Array of -1 (left) or 1 (right) directions
  currentRow: number; // Current row in the logical grid
  progress: number; // 0 to 1 progress between rows
  finished: boolean;
  color: string;
}

export interface Multiplier {
  label: string; // "110x"
  value: number; // 110
  color: string; // tailwind color class or hex
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface GameConfig {
  rowCount: number;
  risk: RiskLevel;
}