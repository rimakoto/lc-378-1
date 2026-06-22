import { BALL_RADIUS } from '@/store/useGameStore'
import { Line } from '@react-three/drei'

interface AimingLineProps {
  cuePosition: [number, number, number]
  angle: number
  power: number
}

export default function AimingLine({ cuePosition, angle, power }: AimingLineProps) {
  if (power <= 0) return null

  const dirX = Math.cos(angle)
  const dirZ = Math.sin(angle)
  const maxLen = 1.5
  const len = maxLen * Math.min(power, 1)
  const segments = 30

  const points: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    points.push([
      cuePosition[0] + dirX * (BALL_RADIUS * 2 + t * len),
      BALL_RADIUS * 0.1,
      cuePosition[2] + dirZ * (BALL_RADIUS * 2 + t * len),
    ])
  }

  const alpha = 0.3 + power * 0.7

  return (
    <group>
      <Line
        points={points}
        color="#ffd700"
        transparent
        opacity={alpha}
        lineWidth={2}
        dashed={false}
      />
      {power > 0.15 && (
        <mesh
          position={[
            cuePosition[0] + dirX * (BALL_RADIUS * 2 + len),
            BALL_RADIUS * 0.1,
            cuePosition[2] + dirZ * (BALL_RADIUS * 2 + len),
          ]}
          rotation={[-Math.PI / 2, 0, -angle]}
        >
          <coneGeometry args={[0.025 * power, 0.08 * power, 4]} />
          <meshBasicMaterial color="#ff8c00" transparent opacity={alpha} />
        </mesh>
      )}
    </group>
  )
}
