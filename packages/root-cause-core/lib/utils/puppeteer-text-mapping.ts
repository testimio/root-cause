import { RootCausePage } from '../interfaces';

const secondArg = (args: any[]) => args[1];
const firstArg = (args: any[]) => args[0];
const returnValue = (_: any[], returnValue: any) => (typeof returnValue === 'string' ? returnValue : undefined);
type ExtractTextMapping = { [P in keyof RootCausePage]?: (args: any[], returnValue: any) => string | undefined };


export const extractPuppeteerTextMapping = {
    type: secondArg,
    evaluate: returnValue,
    goto: firstArg,
    $eval: returnValue,
} as const as ExtractTextMapping;

export function extractPuppeteerText(fnName: keyof RootCausePage, args: any[], returnValue: any): string | undefined {
    const extractor = extractPuppeteerTextMapping[fnName] || (() => undefined);
    return extractor(args, returnValue);
}
