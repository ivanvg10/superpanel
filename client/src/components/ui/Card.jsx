export default function Card({ children, className = '', hover = true, flat = false }) {
  if (flat) {
    return (
      <div className={`bg-zinc-800/50 rounded-xl border border-zinc-800 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl shadow-card
        ${hover ? 'hover:border-zinc-700 hover:shadow-card-hover' : ''}
        transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
