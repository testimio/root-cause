export const fakeOfType = (name: string) => ({ constructor: { name } });

export const Page = fakeOfType('Page');
export const Keyboard = fakeOfType('Keyboard');
export const ElementHandle = fakeOfType('ElementHandle');
export const Mouse = fakeOfType('Mouse');
export const Frame = fakeOfType('Frame');
