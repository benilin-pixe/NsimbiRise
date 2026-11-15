import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  const [imgSrc, setImgSrc] = useState<'/logo.png' | '/logo.svg'>('/logo.png');

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
  }[size];

  return (
    <div
      className={`${sizeClasses} overflow-hidden bg-[#071126] border border-cyan-500/30 shadow-lg shadow-cyan-950/50 flex items-center justify-center shrink-0 ${className}`}
    >
      <img
        src={imgSrc}
        alt="Nsimbi Rise logo"
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc !== '/logo.svg') {
            setImgSrc('/logo.svg');
          }
        }}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
