import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import PoolTable from '@/components/PoolTable'
import Balls from '@/components/Balls'
import UI from '@/components/UI'
import { useGameStore, BALL_RADIUS, MAX_POWER, BallData } from '@/store/useGameStore'
import { stepPhysics } from '@/utils/physics'

if (typeof window !== 'undefined') {
  ;(window as any).__poolStore = useGameStore
  ;(window as any).__getState = useGameStore.getState
}

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

function AimingLine({ cuePosition, angle, power }: { cuePosition: [number, number, number]; angle: number; power: number }) {
  if (power <= 0) return null
  const dirX = Math.cos(angle)
  const dirZ = Math.sin(angle)
  const maxLen = 1.5
  const len = maxLen * Math.min(power, 1)
  const segments = 30
  const lineY = BALL_RADIUS * 0.9
  const points: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    points.push([
      cuePosition[0] + dirX * (BALL_RADIUS * 2 + t * len),
      lineY,
      cuePosition[2] + dirZ * (BALL_RADIUS * 2 + t * len),
    ])
  }
  const alpha = 0.35 + power * 0.65
  return (
    <group>
      <Line
        points={points}
        color="#ffd700"
        transparent
        opacity={alpha}
        lineWidth={3}
      />
      {power > 0.15 && (
        <mesh
          position={[
            cuePosition[0] + dirX * (BALL_RADIUS * 2 + len),
            lineY,
            cuePosition[2] + dirZ * (BALL_RADIUS * 2 + len),
          ]}
          rotation={[-Math.PI / 2, 0, -angle]}
        >
          <coneGeometry args={[0.035 * Math.max(power, 0.3), 0.1 * Math.max(power, 0.3), 4]} />
          <meshBasicMaterial color="#ff8c00" transparent opacity={alpha} />
        </mesh>
      )}
    </group>
  )
}

function SceneContent({ onCuePointerDown }: { onCuePointerDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const balls = useGameStore((s) => s.balls)
  const aimingPower = useGameStore((s) => s.aimingPower)
  const aimingAngle = useGameStore((s) => s.aimingAngle)
  const cueBall = balls.find((b) => b.isCue)!

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

function Scene() {
  const gameState = useGameStore((s) => s.gameState)
  const setGameState = useGameStore((s) => s.setGameState)
  const setAiming = useGameStore((s) => s.setAiming)
  const shootCue = useGameStore((s) => s.shootCue)

  const isDragging = useRef(false)
  const tablePlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const hitPoint = useRef(new THREE.Vector3())
  const cueCenter = useRef(new THREE.Vector3())
  const cueBall = useGameStore((s) => s.balls.find((b) => b.isCue))!

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
      const store = useGameStore.getState()
      if (store.gameState !== 'aiming') return

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
        store.setAiming(power, angle)
      }
    }

    function onPointerUp() {
      if (!isDragging.current) return
      isDragging.current = false
      try {
        gl.domElement.releasePointerCapture?.((window as any).__lastPointerId ?? 0)
      } catch {}
      document.body.style.cursor = ''

      const store = useGameStore.getState()
      if (store.gameState === 'aiming') {
        const power = store.aimingPower
        const angle = store.aimingAngle
        store.setAiming(0, 0)
        if (power > 0.02) {
          const vx = Math.cos(angle) * MAX_POWER * power
          const vz = Math.sin(angle) * MAX_POWER * power
          store.shootCue(vx, vz)
        } else {
          store.setGameState('idle')
        }
      }
    }

    const onMove = onPointerMove as any
    const onUp = onPointerUp as any
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [camera, size, gl, tablePlane, raycaster])

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
    setGameState('aiming')
    setAiming(0, 0)
  }

  return <SceneContent onCuePointerDown={onCuePointerDown} />
}

const physicsState = {
  localBalls: null as BallData[] | null,
  initialized: false,
}

function runPhysicsStep(dt: number) {
  const state = useGameStore.getState()

  if (state.gameState === 'idle' && !physicsState.localBalls) {
    physicsState.localBalls = state.balls.map((b) => ({
      ...b,
      position: [...b.position] as [number, number, number],
      velocity: [...b.velocity] as [number, number],
    }))
    return
  }

  if (state.gameState !== 'rolling') return
  if (!physicsState.localBalls) return

  const simBalls = physicsState.localBalls
  const subSteps = 4
  const sdt = Math.min(dt, 0.033) / subSteps
  let allStopped = true

  for (let step = 0; step < subSteps; step++) {
    const stopped = stepPhysics(simBalls, sdt)
    if (step === subSteps - 1) allStopped = stopped
  }

  state.setBalls(simBalls.map((b) => ({
    ...b,
    position: [...b.position] as [number, number, number],
    velocity: [...b.velocity] as [number, number],
  })))

  if (allStopped) {
    physicsState.localBalls = null
    state.setGameState('idle')
  }
}

useGameStore.subscribe((state, prevState) => {
  if (prevState.gameState !== 'rolling' && state.gameState === 'rolling') {
    physicsState.localBalls = state.balls.map((b) => ({
      ...b,
      position: [...b.position] as [number, number, number],
      velocity: [...b.velocity] as [number, number],
    }))
  }
})

export default function Home() {
  useEffect(() => {
    let lastTime = performance.now()
    let running = true
    let timeoutId: number | null = null

    function tick() {
      if (!running) return
      try {
        const now = performance.now()
        const dt = Math.min((now - lastTime) / 1000, 0.033)
        lastTime = now

        runPhysicsStep(dt)
      } catch (e) {
        console.error('[tick] error:', e)
      } finally {
        if (running) {
          timeoutId = window.setTimeout(tick, 16)
        }
      }
    }

    tick()

    return () => {
      running = false
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

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
