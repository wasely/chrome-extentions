import type { ImgHTMLAttributes } from 'react';

import logoUrl from '../../public/icon/128.png?inline';

export function BrandLogo({ style, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      alt=""
      draggable={false}
      src={logoUrl}
      {...props}
      style={{ ...style, objectFit: 'contain' }}
    />
  );
}
