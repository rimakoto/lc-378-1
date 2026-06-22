import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import PoolTable from '@/components/PoolTable'
import Balls from '@/components/Balls'
import AimingLine from '@/components/AimingLine'
import PhysicsLoop from '@/components/PhysicsLoop'
import UI from '@/components/UI'
import { useGameStore, BALL_RADIUS, MAX_POWER } from '@/store/useGameStore'

function CameraRig() {
  const { camera } = useThree()
  const setup = useRef(false)
  useEffect(() => {
    if (setup.current) return
    setup.current = true
    camera.position.set(0, 2.6, 1.8)
    camera.lookAt(0, 0, 0)
  }, [camera])
  return null
}

function Floor() {
  return (
    <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#1a1410" roughness={0.9} />
    </mesh>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#fff5e6" />
      <directionalLight
        position={[1.5, 5, 2]}
        intensity={1.3}
        color="#fff3d4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0005}
      />
      <pointLight position={[0, 1.8, 0]} intensity={0.6} color="#ffd59a" distance={6} decay={2} />
      <pointLight position={[-1.5, 1.2, 0.8]} intensity={0.25} color="#ff9966" distance={5} decay={2} />
      <pointLight position={[1.5, 1.2, -0.8]} intensity={0.25} color="#66aaff" distance={5} decay={2} />
    </>
  )
}

function Scene() {
  const balls = useGameStore((s) => s.balls)
  const gameState = useGameStore((s) => s.gameState)
  const setGameState = useGameStore((s) => s.setGameState)
  const setAiming = useGameStore((s) => s.setAiming)
  const shootCue = useGameStore((s) => s.shootCue)
  const aimingPower = useGameStore((s) => s.aimingPower)
  const aimingAngle = useGameStore((s) => s.aimingAngle)

  const isDragging = useRef(false)
  const tablePlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const hitPoint = useRef(new THREE.Vector3())
  const cueCenter = useRef(new THREE.Vector3())
  const dragStartCue = useRef<[number, number]>([0, 0])

  const cueBall = balls.find((b) => b.isCue)!

  const { camera, gl, size } = useThree()

  useEffect(() => {
    function updateWorldFromNDC(ndc: THREE.Vector2): boolean {
      raycaster.setFromCamera(ndc, camera)
      const inter = new THREE.Vector3()
      const hit = raycaster.ray.intersectPlane(tablePlane, inter)
      if (hit) {
        hitPoint.current.copy(inter)
        return true
      }
      return false
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return
      e.preventDefault()
      const x = (e.clientX / size.width) * 2 - 1
      const y = -(e.clientY / size.height) * 2 + 1
      const ndc = new THREE.Vector2(x, y)
      if (!updateWorldFromNDC(ndc)) return

      const dx = hitPoint.current.x - cueCenter.current.x
      const dz = hitPoint.current.z - cueCenter.current.z
      let dist = Math.hypot(dx, dz)
      const maxDrag = 0.6
      if (dist > 0.001) {
        if (dist > maxDrag) dist = maxDrag
        const power = dist / maxDrag
        const angle = Math.atan2(-dz, -dx)
        setAiming(power, angle)
      }
    }

    function onPointerUp() {
      if (!isDragging.current) return
      isDragging.current = false
      gl.domElement.releasePointerCapture?.((window as any).__lastPointerId ?? 0)
      document.body.style.cursor = ''

      if (gameState === 'aiming') {
        const power = useGameStore.getState().aimingPower
        const angle = useGameStore.getState().aimingAngle
        if (power > 0.02) {
          const vx = Math.cos(angle) * MAX_POWER * power
          const vz = Math.sin(angle) * MAX_POWER * power
          shootCue(vx, vz)
          setAiming(0, 0)
        } else {
          setGameState('idle')
          setAiming(0, 0)
        }
      }
    }

    window.addEventListener('pointermove', onPointerMove as any)
    window.addEventListener('pointerup', onPointerUp as any)
    window.addEventListener('pointercancel', onPointerUp as any)
    return () => {
      window.removeEventListener('pointermove', onPointerMove as any)
      window.removeEventListener('pointerup', onPointerUp as any)
      window.removeEventListener('pointercancel', onPointerUp as any)
    }
  }, [camera, size, gl, gameState, setAiming, shootCue, setGameState, tablePlane, raycaster])

  const onCuePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (gameState !== 'idle') return
    e.stopPropagation()
    isDragging.current = true
    ;(window as any).__lastPointerId = e.pointerId
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId)
    } catch {}
    document.body.style.cursor = 'grabbing'

    cueCenter.current.set(cueBall.position[0], BALL_RADIUS, cueBall.position[2])
    dragStartCue.current = [cueBall.position[0], cueBall.position[2]]
    setGameState('aiming')
    setAiming(0, 0)
  }

  return (
    <>
      <CameraRig />
      <Lights />
      <Floor />
      <PoolTable />
      <Balls onCuePointerDown={onCuePointerDown} />
      <AimingLine
        cuePosition={[cueBall.position[0], cueBall.position[1], cueBall.position[2]]}
        angle={aimingAngle}
        power={aimingPower}
      />
      <PhysicsLoop />
      <fog attach="fog" args={['#0a0604', 4, 9]} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function Home() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#0d0704] to-black pointer-events-none" />
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2.6, 1.8], fov: 45, near: 0.1, far: 100 }}
        className="absolute inset-0"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <Scene />
      </Canvas>
      <UI />
    </div>
  )
}
