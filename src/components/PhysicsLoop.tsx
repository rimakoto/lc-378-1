import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import { stepPhysics } from '@/utils/physics'
import * as THREE from 'three'

export default function PhysicsLoop() {
  const ballsRef = useRef(useGameStore.getState().balls)
  const setBalls = useGameStore((s) => s.setBalls)
  const setGameState = useGameStore((s) => s.setGameState)
  const gameState = useGameStore((s) => s.gameState)
  const clockRef = useRef(new THREE.Clock())
  const pendingShootRef = useRef<{ vx: number; vz: number } | null>(null)

  useEffect(() => {
    const unsubBalls = useGameStore.subscribe(
      (state) => {
        ballsRef.current = state.balls
      },
    )
    return unsubBalls
  }, [])

  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => {
        if (state.gameState === 'rolling') {
          const cue = ballsRef.current.find((b) => b.isCue)
          if (cue) {
            pendingShootRef.current = { vx: cue.velocity[0], vz: cue.velocity[1] }
          }
        }
      },
    )
    return unsub
  }, [])

  useFrame(() => {
    const dt = Math.min(clockRef.current.getDelta(), 0.033)
    if (gameState !== 'rolling') return

    if (pendingShootRef.current) {
      const cue = ballsRef.current.find((b) => b.isCue)
      if (cue) {
        ;(cue.velocity as number[])[0] = pendingShootRef.current.vx
        ;(cue.velocity as number[])[1] = pendingShootRef.current.vz
      }
      pendingShootRef.current = null
    }

    const subSteps = 3
    const sdt = dt / subSteps
    let allStopped = true
    for (let step = 0; step < subSteps; step++) {
      const stopped = stepPhysics(ballsRef.current, sdt)
      if (step === subSteps - 1) allStopped = stopped
    }

    setBalls([...ballsRef.current.map((b) => ({ ...b }))])
    if (allStopped) {
      setGameState('idle')
    }
  })

  return null
}
