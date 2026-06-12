function Bone({ className }) {
  return (
    <div
      className={`rounded-ios bg-gradient-to-r from-ios-elev via-ios-elev2 to-ios-elev bg-[length:400px_100%] animate-shimmer ${className}`}
    />
  );
}

export default function PageLoader({ rows = 5 }) {
  return (
    <div className="max-w-2xl mx-auto p-5 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2 pt-4">
        <Bone className="h-8 w-52" />
        <Bone className="h-4 w-40" />
      </div>

      {/* Rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bone key={i} className="h-16 w-full rounded-ios-lg" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-2xl mx-auto p-5">
      <div className="bg-ios-red/10 rounded-ios-lg p-5 flex items-start gap-3">
        <div className="w-6 h-6 mt-0.5 rounded-full bg-ios-red/20 flex items-center justify-center flex-shrink-0">
          <span className="text-ios-red text-xs font-bold">!</span>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-ios-red mb-1">Error al cargar</p>
          <p className="text-[15px] text-ios-red/70 mb-3">{typeof message === 'string' ? message : JSON.stringify(message)}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[13px] font-semibold text-ios-blue hover:underline underline-offset-2"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
