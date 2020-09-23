import { useMemo } from 'react';
import { useResizeEffect } from './useResizeEffect';
import { useImageDimensions } from './useImageDimensions';
import { useClientRect } from './useClientRect';
import { HasRectangle } from '@testim/root-cause-types';

export type ImageStretchBehavior = 'content-fit' | 'zoom';
export function useBackgroundHighlight(
  step: HasRectangle,
  image: React.RefObject<HTMLImageElement>,
  container: React.RefObject<HTMLDivElement>,
  imageStretchBehavior: ImageStretchBehavior
) {
  const imageDimensions = useImageDimensions(image);
  const resizeState = useResizeEffect();
  const containerDimensions = useClientRect(container, resizeState);

  return useMemo(() => {
    if (!containerDimensions || !imageDimensions) {
      return [undefined, undefined, undefined] as const;
    }

    const widthConstraint = imageDimensions.width / containerDimensions.width;
    const heightConstraint = imageDimensions.height / containerDimensions.height;
    const ratio =
      imageStretchBehavior === 'zoom'
        ? Math.min(widthConstraint, heightConstraint)
        : Math.max(widthConstraint, heightConstraint);

    const screenshotSize = {
      width: imageDimensions?.width / ratio,
      height: imageDimensions?.height / ratio,
    };

    if (!step.rect || !step.rect?.width) {
      return [screenshotSize, undefined, undefined] as const;
    }

    const rect = step.rect;

    // "weird Oren logic" copied from clickim :(
    // https://images-na.ssl-images-amazon.com/images/I/81shzdivO%2BL._AC_UL1500_.jpg

    let ratioBetweenRectangleAndImage =
      Math.max(screenshotSize.width, screenshotSize.height) / Math.max(rect.width, rect.height);

    if (rect.width > 50) {
      // small Oren logic copied from clickim we rely on
      ratioBetweenRectangleAndImage = 2;
    }
    const backgroundScaleFactor = imageStretchBehavior === 'zoom' ? ratioBetweenRectangleAndImage : 1;

    screenshotSize.width *= backgroundScaleFactor;
    screenshotSize.height *= backgroundScaleFactor;

    const highlightCoordinates = {
      top: (rect.top / ratio) * rect.devicePixelRatio * backgroundScaleFactor,
      left: (rect.left / ratio) * rect.devicePixelRatio * backgroundScaleFactor,
      height: (rect.height / ratio) * rect.devicePixelRatio * backgroundScaleFactor,
      width: (rect.width / ratio) * rect.devicePixelRatio * backgroundScaleFactor,
    };

    const center = {
      top:
        -(((rect.top + rect.height / 2) / ratio) * rect.devicePixelRatio) * backgroundScaleFactor +
        containerDimensions.height / 2,
      left:
        -(((rect.left + rect.width / 2) / ratio) * rect.devicePixelRatio) * backgroundScaleFactor +
        containerDimensions.width / 2,
    };

    const imageOffset = imageStretchBehavior === 'content-fit' ? undefined : center;
    return [screenshotSize, highlightCoordinates, imageOffset] as const;

    // eslint-disable-next-line no-unreachable
    resizeState.toString(); // explicitly cause side-effect for react hooks lint
  }, [containerDimensions, imageDimensions, step.rect, resizeState, imageStretchBehavior]);
}
