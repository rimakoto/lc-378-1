import { create } from 'zustand'

export type GameState = 'idle' | 'aiming' | 'rolling'

export interface BallData {
  id: number
  position: [number, number, number]
  velocity: [number, number]
  color: string
  number: number
  isCue: boolean
}

export const BALL_RADIUS = 0.028
export const TABLE_INNER_WIDTH = 2.54
export const TABLE_INNER_HEIGHT = 1.27
export const RESTITUTION = 0.95
export const FRICTION = 0.992
export const MIN_VELOCITY = 0.002
export const MAX_POWER = 3.5

const BALL_COLORS: Record<number, string> = {
  1: '#f5d300',
  2: '#1a4fbb',
  3: '#e63946',
  4: '#4a148c',
  5: '#ff6f00',
  6: '#00695c',
  7: '#8b0000',
  8: '#111111',
  9: '#f5d300',
  10: '#1a4fbb',
  11: '#e63946',
  12: '#4a148c',
  13: '#ff6f00',
  14: '#00695c',
  15: '#8b0000',
}

function createTrianglePositions(): [number, number][] {
  const pos: [number, number][] = []
  const d = BALL_RADIUS * 2
  const rowSpacing = d * 0.8660254
  const numRows = 5
  const totalZ = (numRows - 1) * rowSpacing
  const startZ = -totalZ / 2

  for (let row = 0; row < numRows; row++) {
    const count = row + 1
    const rowZ = startZ + row * rowSpacing
    const rowWidth = (count - 1) * d
    const firstX = -rowWidth / 2
    for (let i = 0; i < count; i++) {
      pos.push([firstX + i * d, rowZ])
    }
  }
  return pos
}

export function createInitialBalls(): BallData[] {
  const balls: BallData[] = []
  const triPositions = createTrianglePositions()
  const triangleCenterX = TABLE_INNER_WIDTH * 0.25
  const triangleCenterZ = 0

  balls.push({
    id: 0,
    position: [
      -TABLE_INNER_WIDTH * 0.25,
      BALL_RADIUS,
      0,
    ],
    velocity: [0, 0],
    color: '#ffffff',
    number: 0,
    isCue: true,
  })

  const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]
  for (let i = 0; i < 15; i++) {
    const num = order[i]
    const [tx, tz] = triPositions[i]
    balls.push({
      id: num,
      position: [triangleCenterX + tx, BALL_RADIUS, triangleCenterZ + tz],
      velocity: [0, 0],
      color: BALL_COLORS[num],
      number: num,
      isCue: false,
    })
  }
  return balls
}

interface GameStore {
  gameState: GameState
  balls: BallData[]
  aimingPower: number
  aimingAngle: number
  setGameState: (s: GameState) => void
  setBalls: (balls: BallData[]) => void
  updateBall: (id: number, patch: Partial<BallData>) => void
  setAiming: (power: number, angle: number) => void
  shootCue: (vx: number, vz: number) => void
  resetBalls: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'idle',
  balls: createInitialBalls(),
  aimingPower: 0,
  aimingAngle: 0,

  setGameState: (s) => set({ gameState: s }),
  setBalls: (balls) => set({ balls }),
  updateBall: (id, patch) =>
    set((state) => ({
      balls: state.balls.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
  setAiming: (power, angle) => set({ aimingPower: power, aimingAngle: angle }),
  shootCue: (vx, vz) =>
    set((state) => ({
      balls: state.balls.map((b) => (b.isCue ? { ...b, velocity: [vx, vz] } : b)),
      gameState: 'rolling',
    })),
  resetBalls: () =>
    set({
      balls: createInitialBalls(),
      gameState: 'idle',
      aimingPower: 0,
      aimingAngle: 0,
    }),
}))
