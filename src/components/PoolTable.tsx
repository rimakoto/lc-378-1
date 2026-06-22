import { TABLE_INNER_WIDTH, TABLE_INNER_HEIGHT } from '@/store/useGameStore'

const WOOD_COLOR = '#5c3317'
const WOOD_EDGE = '#3d1f0f'
const FELT_COLOR = '#0b6623'
const CUSHION_COLOR = '#084d1a'

export default function PoolTable() {
  const innerW = TABLE_INNER_WIDTH
  const innerH = TABLE_INNER_HEIGHT
  const railW = 0.14
  const outerW = innerW + railW * 2
  const outerH = innerH + railW * 2
  const frameH = 0.16
  const railH = 0.08
  const legW = 0.15
  const legH = 0.9
  const cushionInset = 0.02
  const cushionH = 0.055

  return (
    <group position={[0, -0.001, 0]}>
      <mesh position={[0, -legH - frameH / 2 - 0.001, 0]} receiveShadow>
        <boxGeometry args={[outerW + 0.06, 0.015, outerH + 0.06]} />
        <meshStandardMaterial color="#1a0f08" />
      </mesh>

      {[
        [ outerW / 2 - legW / 2 - 0.02, -legH / 2 - frameH,  outerH / 2 - legW / 2 - 0.02],
        [-outerW / 2 + legW / 2 + 0.02, -legH / 2 - frameH,  outerH / 2 - legW / 2 - 0.02],
        [ outerW / 2 - legW / 2 - 0.02, -legH / 2 - frameH, -outerH / 2 + legW / 2 + 0.02],
        [-outerW / 2 + legW / 2 + 0.02, -legH / 2 - frameH, -outerH / 2 + legW / 2 + 0.02],
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} />
        </mesh>
      ))}

      <mesh position={[0, -frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[outerW, frameH, outerH]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.55} />
      </mesh>

      <mesh position={[0, -frameH - 0.002, 0]}>
        <boxGeometry args={[outerW - 0.04, 0.01, outerH - 0.04]} />
        <meshStandardMaterial color={WOOD_EDGE} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.001, 0]} receiveShadow>
        <boxGeometry args={[innerW, 0.02, innerH]} />
        <meshStandardMaterial color={FELT_COLOR} roughness={0.95} />
      </mesh>

      {[
        { pos: [0, railH / 2,  innerH / 2 + railW / 2], size: [outerW, railH, railW] },
        { pos: [0, railH / 2, -innerH / 2 - railW / 2], size: [outerW, railH, railW] },
        { pos: [ innerW / 2 + railW / 2, railH / 2, 0], size: [railW, railH, outerH] },
        { pos: [-innerW / 2 - railW / 2, railH / 2, 0], size: [railW, railH, outerH] },
      ].map((r, i) => (
        <mesh key={`rail-${i}`} position={r.pos as [number, number, number]} castShadow>
          <boxGeometry args={r.size as [number, number, number]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.5} />
        </mesh>
      ))}

      {[
        { pos: [0, cushionH / 2,  innerH / 2 + cushionInset], size: [innerW - cushionInset * 2, cushionH, cushionInset] },
        { pos: [0, cushionH / 2, -innerH / 2 - cushionInset], size: [innerW - cushionInset * 2, cushionH, cushionInset] },
        { pos: [ innerW / 2 + cushionInset, cushionH / 2, 0], size: [cushionInset, cushionH, innerH - cushionInset * 2] },
        { pos: [-innerW / 2 - cushionInset, cushionH / 2, 0], size: [cushionInset, cushionH, innerH - cushionInset * 2] },
      ].map((r, i) => (
        <mesh key={`cushion-${i}`} position={r.pos as [number, number, number]}>
          <boxGeometry args={r.size as [number, number, number]} />
          <meshStandardMaterial color={CUSHION_COLOR} roughness={0.9} />
        </mesh>
      ))}

      {[
        [ innerW / 2, 0,  innerH / 2],
        [ innerW / 2, 0, -innerH / 2],
        [-innerW / 2, 0,  innerH / 2],
        [-innerW / 2, 0, -innerH / 2],
        [0, 0,  innerH / 2],
        [0, 0, -innerH / 2],
      ].map((p, i) => (
        <mesh key={`pocket-${i}`} position={[p[0], 0.002, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 24]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}

      {[
        [ innerW / 2, 0,  innerH / 2],
        [ innerW / 2, 0, -innerH / 2],
        [-innerW / 2, 0,  innerH / 2],
        [-innerW / 2, 0, -innerH / 2],
        [0, 0,  innerH / 2],
        [0, 0, -innerH / 2],
      ].map((p, i) => (
        <mesh key={`pocket-hole-${i}`} position={[p[0], -0.002, p[2]]}>
          <cylinderGeometry args={[0.055, 0.045, 0.04, 24]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}
    </group>
  )
}
