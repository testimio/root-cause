import path from 'path';
import { BeforeHook, BeforeHookArgs } from '../interfaces';
import { getLast } from '../utils';

declare const document: any;
declare const window: any;

export const puppeteerScreenshot: BeforeHook = async function puppeteerScreenshot(hookArgs) {
  const { proxyContext, testContext, fnName, rootPage } = hookArgs;
  if (!testContext.featuresSettings.screenshots) {
    return;
  }

  const filename = `${testContext.getStepIndex()}.${proxyContext.constructor.name.toLowerCase()}-${fnName}.${
    testContext.featuresSettings.screenshots.format === 'png' ? 'png' : 'jpg'
  }`;

  const rect = await getElementRect(hookArgs);
  if (rect) {
    testContext.addStepMetadata({ rect });
  }

  await rootPage.screenshot({
    path: path.join(testContext.testArtifactsFolder, filename),
    type: testContext.featuresSettings.screenshots.format,
    quality:
      testContext.featuresSettings.screenshots.format === 'jpeg'
        ? testContext.featuresSettings.screenshots.quality
        : undefined,
    fullPage: testContext.featuresSettings.screenshots.fullPage,
  });
  testContext.addStepMetadata({ screenshot: filename });
};

async function getElementRect({ proxyContext, methodCallData }: BeforeHookArgs): Promise<any> {
  if (!shouldExtractElementRect(proxyContext)) {
    return null;
  }

  try {
    const elementHandleRect =
      (await getElementHandleRectWithBoundingBox(proxyContext)) ||
      (await getElementHandleRectWithSelector(proxyContext, getLast(methodCallData)?.selector));

    if (!elementHandleRect || (elementHandleRect as any).error) {
      return elementHandleRect;
    }

    // TODO(Benji) figure out why `$eval` here causes:
    //  "Object reference chain is too long"
    const windowRect: RectFromWindow = await proxyContext.evaluate(function getWindowRect() {
      const { devicePixelRatio, innerWidth: screenWidth, innerHeight: screenHeight } = window;
      return { screenWidth, screenHeight, devicePixelRatio };
    });

    const rect: ScreenshotRect = {
      ...windowRect,
      ...elementHandleRect,
    };

    return rect;
  } catch (error) {
    return { error };
  }
}

async function getElementHandleRectWithBoundingBox(
  proxyContext: any
): Promise<null | RectFromElementHandle> {
  if (typeof proxyContext.boundingBox !== 'function') {
    return null;
  }

  const boundingBox = await proxyContext.boundingBox();
  if (!boundingBox) {
    return null;
  }

  const rect: RectFromElementHandle = {
    ...boundingBox,
    top: boundingBox.y,
    left: boundingBox.x,
    bottom: boundingBox.y + boundingBox.height,
    right: boundingBox.x + boundingBox.width,
  };

  return rect;
}

async function getElementHandleRectWithSelector(
  proxyContext: any,
  selector: string | undefined
): Promise<null | RectFromElementHandle> {
  if (!selector) {
    return null;
  }

  //TODO(Benji) figure out why `$eval` here causes:
  // "Object reference chain is too long"
  const rect = await proxyContext.evaluate(function getElementHandleRectOnBrowserSide(
    selector: string
  ) {
    const element = document.querySelector(selector);
    if (!element) {
      return { error: 'not found' };
    }

    const { x, y, width, height, top, right, bottom, left } = element.getBoundingClientRect();

    // I'm not sure if this is weird DOMRect behavior or something to do with puppeteer,
    // But if we return `element.getBoundingClientRect()` the rect comes out as an empty object.
    // But if we destructure the fields they come out fine.
    return { x, y, width, height, top, right, bottom, left };
  },
  selector);

  return rect;
}

function shouldExtractElementRect({ constructor: { name } }: object) {
  return name === 'ElementHandle' || name === 'Page';
}

interface RectFromElementHandle {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface RectFromWindow {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

type ScreenshotRect = RectFromElementHandle & RectFromWindow;
