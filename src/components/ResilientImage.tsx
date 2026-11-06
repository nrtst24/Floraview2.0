import React, { useState } from 'react';
import { Flower2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EFECE4] via-[#E5E0D5] to-[#D4DDD6] text-[#1B4332] p-4 text-center ${className}`}
      >
        <Flower2 className="w-8 h-8 mb-2 opacity-75" strokeWidth={1.5} />
        <span className="font-serif text-sm font-semibold tracking-tight leading-snug max-w-[180px]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
