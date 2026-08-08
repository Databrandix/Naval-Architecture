'use client';

import {ReactNode} from 'react';
import {motion} from 'motion/react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'yellow' | 'blue' | 'magenta' | 'outline' | 'ghost';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export default function Button({
  children,
  variant = 'blue',
  onClick,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'px-6 py-2.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm';
  
  const variants = {
    yellow: 'bg-secondary-orange text-white hover:bg-secondary-orange/90 shadow-md',
    blue: 'bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-premium',
    magenta: 'bg-accent text-white hover:bg-accent/90 shadow-md',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary/5'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
