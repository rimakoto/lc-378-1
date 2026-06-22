import {
  BallData,
  BALL_RADIUS,
  TABLE_INNER_WIDTH,
  TABLE_INNER_HEIGHT,
  RESTITUTION,
  FRICTION,
  MIN_VELOCITY,
} from '@/store/useGameStore'

const HALF_W = TABLE_INNER_WIDTH / 2
const HALF_H = TABLE_INNER_HEIGHT / 2
const WALL_PAD = BALL_RADIUS * 0.1

export function resolveBallBallCollision(a: BallData, b: BallData) {
  const dx = a.position[0] - b.position[0]
  const dz = a.position[2] - b.position[2]
  const distSq = dx * dx + dz * dz
  const minDist = BALL_RADIUS * 2
  if (distSq >= minDist * minDist || distSq === 0) return

  const dist = Math.sqrt(distSq)
  const nx = dx / dist
  const nz = dz / dist

  const overlap = minDist - dist
  const halfOverlap = overlap / 2
  ;(a.position as number[])[0] += nx * halfOverlap
  ;(a.position as number[])[2] += nz * halfOverlap
  ;(b.position as number[])[0] -= nx * halfOverlap
  ;(b.position as number[])[2] -= nz * halfOverlap

  const avx = a.velocity[0]
  const avz = a.velocity[1]
  const bvx = b.velocity[0]
  const bvz = b.velocity[1]

  const rvx = bvx - avx
  const rvz = bvz - avz
  const velAlongNormal = rvx * nx + rvz * nz
  if (velAlongNormal > 0) return

  const e = RESTITUTION
  const j = -(1 + e) * velAlongNormal / 2
  const ix = j * nx
  const iz = j * nz

  ;(a.velocity as number[])[0] -= ix
  ;(a.velocity as number[])[1] -= iz
  ;(b.velocity as number[])[0] += ix
  ;(b.velocity as number[])[1] += iz
}

export function resolveWallCollision(b: BallData) {
  const x = b.position[0]
  const z = b.position[2]
  let vx = b.velocity[0]
  let vz = b.velocity[1]
  let newX = x
  let newZ = z

  if (x < -HALF_W + WALL_PAD + BALL_RADIUS) {
    newX = -HALF_W + WALL_PAD + BALL_RADIUS
    vx = -vx * RESTITUTION
  } else if (x > HALF_W - WALL_PAD - BALL_RADIUS) {
    newX = HALF_W - WALL_PAD - BALL_RADIUS
    vx = -vx * RESTITUTION
  }

  if (z < -HALF_H + WALL_PAD + BALL_RADIUS) {
    newZ = -HALF_H + WALL_PAD + BALL_RADIUS
    vz = -vz * RESTITUTION
  } else if (z > HALF_H - WALL_PAD - BALL_RADIUS) {
    newZ = HALF_H - WALL_PAD - BALL_RADIUS
    vz = -vz * RESTITUTION
  }

  if (newX !== x) (b.position as number[])[0] = newX
  if (newZ !== z) (b.position as number[])[2] = newZ
  if (vx !== b.velocity[0]) (b.velocity as number[])[0] = vx
  if (vz !== b.velocity[1]) (b.velocity as number[])[1] = vz
}

export function stepPhysics(balls: BallData[], dt: number): boolean {
  const adjustedFriction = Math.pow(FRICTION, dt * 60)

  for (const b of balls) {
    ;(b.position as number[])[0] += b.velocity[0] * dt
    ;(b.position as number[])[2] += b.velocity[1] * dt
    ;(b.velocity as number[])[0] *= adjustedFriction
    ;(b.velocity as number[])[1] *= adjustedFriction
    const sp = Math.hypot(b.velocity[0], b.velocity[1])
    if (sp < MIN_VELOCITY) {
      ;(b.velocity as number[])[0] = 0
      ;(b.velocity as number[])[1] = 0
    }
  }

  for (let i = 0; i < balls.length; i++) {
    resolveWallCollision(balls[i])
  }

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallBallCollision(balls[i], balls[j])
    }
  }

  return balls.every((b) => b.velocity[0] === 0 && b.velocity[1] === 0)
}
