function Bone({ className }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-zinc-800 via-zinc-700/60 to-zinc-800 bg-[length:400px_100%] animate-shimmer ${className}`}
    />
  );
}

export default function PageLoader({ rows = 5 }) {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-44" />
          <Bone className="h-4 w-72" />
        </div>
        <Bone className="h-9 w-32" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        {[80, 96, 88, 96, 72].map((w, i) => (
          <Bone key={i} className={`h-8 w-${w === 80 ? '[80px]' : w === 96 ? '[96px]' : w === 88 ? '[88px]' : '[72px]'} rounded-full`} />
        ))}
      </div>

      {/* Rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bone key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="p-8">
      <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 flex items-start gap-3">
        <div className="w-5 h-5 mt-0.5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-red-400 text-xs font-bold">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-300 mb-1">Error al cargar</p>
          <p className="text-sm text-red-400/70 mb-3">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
