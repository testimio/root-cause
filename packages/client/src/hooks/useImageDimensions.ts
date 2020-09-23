import { useState, useLayoutEffect } from 'react';

export function useImageDimensions(imageRef: React.RefObject<HTMLImageElement>) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    (async () => {
      if (!imageRef?.current) {
        return;
      }
      await imageLoaded(imageRef.current);
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        });
      }
    })();
  }, [imageRef]);
  return imageSize;
}

async function imageLoaded(imageElement: HTMLImageElement) {
  if (imageElement.naturalWidth) {
    return true;
  }
  await new Promise((resolve) => imageElement.addEventListener('load', resolve, { once: true }));
  return true;
}
