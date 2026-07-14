import type { ImgHTMLAttributes } from 'react';

export function LazyImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img loading="lazy" decoding="async" {...props} />;
}
