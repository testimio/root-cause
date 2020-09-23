// Mostly copied from stack-utils types
export interface StackLineData extends StackData {
    evalLine?: number;
    evalColumn?: number;
    evalFile?: string;
}

export interface StackData {
    line?: number;
    column?: number;
    file?: string;
    constructor?: boolean;
    evalOrigin?: string;
    native?: boolean;
    function?: string;
    method?: string;
}
