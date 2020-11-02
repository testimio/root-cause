import { useState, useEffect } from 'react';

export function useResizeEffect() {
  const [resizeState, setResizeState] = useState<number>(0);

  useEffect(() => {
    const listener = () => {
      setResizeState((oldS) => (oldS += 1));
    };

    window.addEventListener('resize', listener, { passive: true });

    return () => window.removeEventListener('resize', listener);
  }, []);

  return resizeState;
}
