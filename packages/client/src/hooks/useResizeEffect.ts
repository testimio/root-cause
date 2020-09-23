import { useState, useEffect } from 'react';

export function useResizeEffect() {
  const [resizeState, setResizeState] = useState<any>();

  useEffect(() => {
    const listener = () => {
      setResizeState(Date.now());
    };
    window.addEventListener('resize', listener, { passive: true });
    return () => window.removeEventListener('resize', listener);
  }, []);
  return resizeState;
}
