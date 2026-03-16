import { memo } from 'react';

export const RemoteImage = memo(({ src, alt, className = '', fallbackSrc = 'https://ui-avatars.com/api/?name=User&background=random' }) => (
  <img 
    src={src || fallbackSrc} 
    alt={alt} 
    className={`${className} transform-gpu`} 
    style={{ transform: 'translateZ(0)' }} 
    loading="lazy" 
    onError={(e) => { e.target.src = fallbackSrc; }} 
  />
));