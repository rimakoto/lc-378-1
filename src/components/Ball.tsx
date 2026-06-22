import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { BallData, BALL_RADIUS } from '@/store/useGameStore'

interface BallProps {
  ball: BallData
  onPointerDown?: (e: PointerEvent) => void
}

export default function Ball({ ball, onPointerDown }: BallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const prevPos = useRef<[number, number]>([ball.position[0], ball.position[2]])

  useEffect(() => {
    if (!meshRef.current) return
    const dx = ball.position[0] - prevPos.current[0]
    const dz = ball.position[2] - prevPos.current[1]
    const dist = Math.hypot(dx, dz)
    if (dist > 0.0001) {
      const axis = new THREE.Vector3(dz, 0, -dx).normalize()
      const angle = dist / BALL_RADIUS
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle)
      meshRef.current.quaternion.premultiply(q)
    }
    prevPos.current = [ball.position[0], ball.position[2]]
  }, [ball.position[0], ball.position[2]])

  const showStripe = ball.number >= 9 && ball.number <= 15
  const isSolidBlack = ball.number === 8
  const baseColor = ball.color

  return (
    <mesh
      ref={meshRef}
      position={ball.position as [number, number, number]}
      castShadow
      onPointerDown={onPointerDown as any}
    >
      <sphereGeometry args={[BALL_RADIUS, 48, 32]} />
      <meshPhysicalMaterial
        color={showStripe ? '#ffffff' : baseColor}
        roughness={0.15}
        metalness={0.05}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        reflectivity={0.4}
      />
      {(showStripe || isSolidBlack) && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[BALL_RADIUS + 0.0001, 48, 32, 0, Math.PI * 2, 0.9, Math.PI * 0.65]} />
          <meshPhysicalMaterial
            color={baseColor}
            roughness={0.15}
            metalness={0.05}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
          />
        </mesh>
      )}
      {ball.number > 0 && (
        <group position={[0, 0, 0]}>
          {[0, 1].map((i) => {
            const rot = i === 0 ? 0 : Math.PI
            return (
              <group key={i} rotation={[0, rot, 0]}>
                <mesh position={[0, 0, BALL_RADIUS - 0.001]}>
                  <circleGeometry args={[BALL_RADIUS * 0.38, 24]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            )
          })}
        </group>
      )}
    </mesh>
  )
}
