/**
 * Module declarations for packages without TypeScript types
 */

// @ungap/structured-clone doesn't ship with TypeScript declarations
declare module '@ungap/structured-clone' {
  function structuredClone<T>(value: T, options?: StructuredSerializeOptions): T;
  export = structuredClone;
}

// diff package doesn't ship with TypeScript declarations
declare module 'diff' {
  export interface Change {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
  }

  export function diffChars(oldStr: string, newStr: string): Change[];
  export function diffWords(oldStr: string, newStr: string): Change[];
  export function diffLines(oldStr: string, newStr: string): Change[];
  export function diffSentences(oldStr: string, newStr: string): Change[];
  export function diffJson(oldObj: object, newObj: object): Change[];
  export function diffArrays<T>(oldArr: T[], newArr: T[]): Change[];
}
