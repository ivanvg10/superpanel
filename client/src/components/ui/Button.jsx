import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary:     'bg-indigo-600 text-white hover:bg-indigo-500 shadow-glow-sm hover:shadow-glow',
  secondary:   'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600',
  ghost:       'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70',
  destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
};

const sizes = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, disabled, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-xl font-medium
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default Button;
