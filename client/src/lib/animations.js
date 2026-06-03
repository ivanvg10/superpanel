// Variantes reutilizables de Framer Motion — úsalas como referencia del DESIGN_SYSTEM.md

const ease = [0.16, 1, 0.3, 1]; // ease-out expo

export const fadeUp = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
  exit:      { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease } },
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease } },
  exit:    { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease } },
  exit:    { opacity: 0, scale: 0.94, transition: { duration: 0.12 } },
};
