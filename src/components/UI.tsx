import { RotateCcw, Info } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'

export default function UI() {
  const resetBalls = useGameStore((s) => s.resetBalls)
  const gameState = useGameStore((s) => s.gameState)
  const aimingPower = useGameStore((s) => s.aimingPower)

  return (
    <>
      <div className="fixed top-6 left-6 z-10 pointer-events-none">
        <h1
          className="text-4xl font-bold text-white tracking-wide drop-shadow-lg"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.08em' }}
        >
          3D 台球
        </h1>
        <p className="mt-1 text-sm text-amber-100/80 drop-shadow">拖拽白球蓄力瞄准，松手击球</p>
      </div>

      <div className="fixed top-6 right-6 z-10 flex gap-3">
        <button
          onClick={resetBalls}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl
                     bg-white/10 backdrop-blur-md border border-white/20
                     text-white hover:bg-white/20 transition-all duration-300
                     hover:scale-105 active:scale-95 shadow-lg"
        >
          <RotateCcw size={18} strokeWidth={2} />
          <span className="text-sm font-medium tracking-wide">重新摆球</span>
        </button>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          {aimingPower > 0 && (
            <div className="w-64">
              <div className="flex justify-between text-xs text-amber-100/80 mb-1 px-1">
                <span>力度</span>
                <span>{Math.round(aimingPower * 100)}%</span>
              </div>
              <div className="h-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${aimingPower * 100}%`,
                    background: `linear-gradient(90deg, #4ade80, #facc15 ${60}%, #ef4444)`,
                    boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)',
                  }}
                />
              </div>
            </div>
          )}
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider
                        backdrop-blur-md border transition-all duration-300
                        ${gameState === 'idle' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : ''}
                        ${gameState === 'aiming' ? 'bg-amber-500/20 text-amber-200 border-amber-400/30' : ''}
                        ${gameState === 'rolling' ? 'bg-sky-500/20 text-sky-200 border-sky-400/30' : ''}`}
          >
            {gameState === 'idle' && '● 准备就绪'}
            {gameState === 'aiming' && '● 瞄准中'}
            {gameState === 'rolling' && '● 滚动中'}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-10 group">
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl
                        bg-white/5 backdrop-blur-sm border border-white/10
                        text-white/60 text-xs cursor-help transition-all
                        hover:bg-white/10 hover:text-white/80">
          <Info size={14} />
          <span>提示：按住白球拖拽</span>
        </div>
      </div>
    </>
  )
}
