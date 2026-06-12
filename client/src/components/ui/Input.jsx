import { forwardRef } from 'react';

// Campos estilo iOS: fondo elevado, esquinas redondeadas, foco azul de sistema.
const Input = forwardRef(function Input(
  { label, error, hint, className = '', as: Tag = 'input', ...props },
  ref
) {
  const base = `
    w-full bg-ios-elev2 rounded-[10px] text-ios-label placeholder-ios-label3
    text-[15px] transition-all duration-150 outline-none border
    focus:ring-2 focus:ring-ios-blue/40 focus:border-ios-blue/60
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error
      ? 'border-ios-red/60 focus:ring-ios-red/30 focus:border-ios-red/60'
      : 'border-transparent hover:border-ios-sep'
    }
    ${Tag === 'textarea' ? 'px-3.5 py-3 resize-none' : 'px-3.5 h-11'}
    ${className}
  `;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ios-label2 px-1">
          {label}
        </label>
      )}
      <Tag ref={ref} className={base} {...props} />
      {error && <p className="text-[13px] text-ios-red px-1">{error}</p>}
      {hint && !error && <p className="text-[13px] text-ios-label2 px-1">{hint}</p>}
    </div>
  );
});

export default Input;
