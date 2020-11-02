import { useState, useLayoutEffect } from 'react';

export function useClientRect(ref: React.RefObject<HTMLElement>, resizeState?: number) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const { current: refCurrent } = ref;

  useLayoutEffect(() => {
    if (!refCurrent) {
      setRect(null);
    }

    setRect(refCurrent?.getBoundingClientRect() ?? null);
  }, [refCurrent, resizeState]);

  return rect;
}
