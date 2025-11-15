export enum StreamEnums {
  TextStart = 'text-start',
  TextDelta = 'text-delta',
  TextEnd = 'text-end',
  Finish = 'finish',
  Done = '[DONE]',
  Error = 'error',
  ReasoningStart = 'reasoning-start',
  ReasoningDelta = 'reasoning-delta',
  ReasoningEnd = 'reasoning-end',
  ToolCall = 'tool-call',
  ToolResult = 'tool-result',
  StartStep = 'start-step',
  FinishStep = 'finish-step',
}

export const StreamEnumsSet = new Set<string>(Object.values(StreamEnums));
