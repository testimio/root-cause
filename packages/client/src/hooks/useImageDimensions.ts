import { useState, useLayoutEffect } from 'react';

export function useImageDimensions(imageElement: HTMLImageElement | null) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    (async () => {
      if (!imageElement) {
        return;
      }

      await imageLoaded(imageElement);

      if (imageElement) {
        setImageSize({
          width: imageElement.naturalWidth,
          height: imageElement.naturalHeight,
        });
      }
    })();
  }, [imageElement]);

  return imageSize;
}

async function imageLoaded(imageElement: HTMLImageElement) {
  if (imageElement.naturalWidth) {
    return true;
  }
  await new Promise((resolve) => imageElement.addEventListener('load', resolve, { once: true }));
  return true;
}
