import React from 'react';

interface VerityLogoProps {
  className?: string;
  size?: number;
}

export const VerityLogo: React.FC<VerityLogoProps> = ({ className = 'h-8 md:h-10', size }) => {
  return (
    <img 
      src="/v-logo.png" 
      alt="VERITY" 
      width={size}
      height={size}
      className={`${className} object-contain select-none transition-all drop-shadow-[0_0_12px_rgba(0,213,229,0.35)] group-hover:drop-shadow-[0_0_20px_rgba(0,213,229,0.7)]`} 
    />
  );
};
