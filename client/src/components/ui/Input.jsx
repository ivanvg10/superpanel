import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', as: Tag = 'input', ...props },
  ref
) {
  const base = `
    w-full bg-zinc-900 border rounded-xl text-zinc-100 placeholder-zinc-600
    text-sm transition-all duration-150 outline-none
    focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error
      ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500/60'
      : 'border-zinc-800 hover:border-zinc-700'
    }
    ${Tag === 'textarea' ? 'px-3.5 py-3 resize-none' : 'px-3.5 h-10'}
    ${className}
  `;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <Tag ref={ref} className={base} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
});

export default Input;
