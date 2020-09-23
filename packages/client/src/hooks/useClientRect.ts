import { useState, useLayoutEffect } from 'react';

export function useClientRect(ref: React.RefObject<HTMLElement>, resizeState?: number) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      setRect(null);
    }
    setRect(ref.current?.getBoundingClientRect() ?? null);
  }, [ref, resizeState]);

  return rect;
}
