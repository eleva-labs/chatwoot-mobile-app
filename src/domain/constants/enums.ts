export enum StreamEnums {
  TextStart = 'text_start',
  TextDelta = 'text_delta',
  TextEnd = 'text_end',
  Finish = 'finish',
  Done = '[DONE]',
  Error = 'error',
  ReasoningStart = 'reasoning_start',
  ReasoningDelta = 'reasoning_delta',
  ReasoningEnd = 'reasoning_end',
  ToolCall = 'tool_call',
  ToolResult = 'tool_result',
  StartStep = 'start_step',
  FinishStep = 'finish_step',
}

export const StreamEnumsSet = new Set<string>(Object.values(StreamEnums));
