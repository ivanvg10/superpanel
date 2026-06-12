import { forwardRef } from 'react';
import { motion } from 'framer-motion';

// Botones estilo iOS: fill azul de sistema, esquinas redondeadas, semibold.
const variants = {
  primary:     'bg-ios-blue text-white hover:bg-ios-blue/90 active:bg-ios-blue/80',
  secondary:   'bg-ios-elev2 text-ios-label hover:bg-ios-elev2/70',
  ghost:       'text-ios-blue hover:bg-ios-elev2',
  destructive: 'bg-ios-red/15 text-ios-red hover:bg-ios-red/25',
};

const sizes = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[15px] gap-2',
  lg: 'h-12 px-5 text-[17px] gap-2.5',
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
        inline-flex items-center justify-center rounded-[12px] font-semibold
        transition-colors duration-150 cursor-pointer select-none
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
