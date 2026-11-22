import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  light?: boolean;
}

export default function Eyebrow({ children, light = false }: EyebrowProps) {
  return <p className={`eyebrow ${light ? 'eyebrow--light' : ''}`}>{children}</p>;
}
