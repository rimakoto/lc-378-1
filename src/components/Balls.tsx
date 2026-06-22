import { useGameStore } from '@/store/useGameStore'
import Ball from './Ball'
import { ThreeEvent } from '@react-three/fiber'

interface BallsProps {
  onCuePointerDown: (e: ThreeEvent<PointerEvent>) => void
}

export default function Balls({ onCuePointerDown }: BallsProps) {
  const balls = useGameStore((s) => s.balls)

  return (
    <group>
      {balls.map((ball) => (
        <Ball
          key={ball.id}
          ball={ball}
          onPointerDown={ball.isCue ? (onCuePointerDown as any) : undefined}
        />
      ))}
    </group>
  )
}
