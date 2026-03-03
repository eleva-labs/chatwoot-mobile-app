import {
  PART_TYPES,
  TOOL_STATES,
  CHAT_STATUS,
  MESSAGE_ROLES,
  MESSAGE_ROLE,
  VOICE_INPUT_STATUS,
  type PartType,
  type ToolState,
  type ChatStatus,
  type MessageRole,
  type VoiceInputStatus,
} from '../constants';

describe('PART_TYPES', () => {
  it('contains all expected text/reasoning types', () => {
    expect(PART_TYPES.TEXT).toBe('text');
    expect(PART_TYPES.REASONING).toBe('reasoning');
  });

  it('contains all SDK tool types', () => {
    expect(PART_TYPES.TOOL_INVOCATION).toBe('tool-invocation');
    expect(PART_TYPES.TOOL_CALL).toBe('tool-call');
    expect(PART_TYPES.TOOL_RESULT).toBe('tool-result');
  });

  it('contains all backend tool types', () => {
    expect(PART_TYPES.TOOL_INPUT_STREAMING).toBe('tool-input-streaming');
    expect(PART_TYPES.TOOL_INPUT_AVAILABLE).toBe('tool-input-available');
    expect(PART_TYPES.TOOL_OUTPUT_AVAILABLE).toBe('tool-output-available');
    expect(PART_TYPES.TOOL_OUTPUT_ERROR).toBe('tool-output-error');
  });

  it('contains file and source types', () => {
    expect(PART_TYPES.FILE).toBe('file');
    expect(PART_TYPES.SOURCE).toBe('source');
    expect(PART_TYPES.STEP_START).toBe('step-start');
  });

  it('contains web-only source types (UNION)', () => {
    expect(PART_TYPES.SOURCE_URL).toBe('source-url');
    expect(PART_TYPES.SOURCE_DOCUMENT).toBe('source-document');
  });

  it('is const-asserted (values are narrowed)', () => {
    const textType: 'text' = PART_TYPES.TEXT;
    expect(textType).toBe('text');
  });
});

describe('TOOL_STATES', () => {
  it('contains all streaming states', () => {
    expect(TOOL_STATES.INPUT_STREAMING).toBe('input-streaming');
    expect(TOOL_STATES.INPUT_AVAILABLE).toBe('input-available');
    expect(TOOL_STATES.OUTPUT_AVAILABLE).toBe('output-available');
    expect(TOOL_STATES.OUTPUT_ERROR).toBe('output-error');
  });

  it('contains legacy fallback states', () => {
    expect(TOOL_STATES.PENDING).toBe('pending');
    expect(TOOL_STATES.RUNNING).toBe('running');
    expect(TOOL_STATES.COMPLETED).toBe('completed');
    expect(TOOL_STATES.FAILED).toBe('failed');
  });

  it('contains web-only states (UNION)', () => {
    expect(TOOL_STATES.INPUT_START).toBe('tool-input-start');
    expect(TOOL_STATES.OUTPUT_STREAMING).toBe('tool-output-streaming');
  });
});

describe('CHAT_STATUS', () => {
  it('contains all chat status values', () => {
    expect(CHAT_STATUS.READY).toBe('ready');
    expect(CHAT_STATUS.SUBMITTED).toBe('submitted');
    expect(CHAT_STATUS.STREAMING).toBe('streaming');
    expect(CHAT_STATUS.ERROR).toBe('error');
  });
});

describe('MESSAGE_ROLES', () => {
  it('contains all message roles', () => {
    expect(MESSAGE_ROLES.USER).toBe('user');
    expect(MESSAGE_ROLES.ASSISTANT).toBe('assistant');
    expect(MESSAGE_ROLES.SYSTEM).toBe('system');
    expect(MESSAGE_ROLES.DATA).toBe('data');
    expect(MESSAGE_ROLES.TOOL).toBe('tool');
  });
});

describe('MESSAGE_ROLE alias', () => {
  it('is the same object as MESSAGE_ROLES', () => {
    expect(MESSAGE_ROLE).toBe(MESSAGE_ROLES);
  });

  it('has all the same values', () => {
    expect(MESSAGE_ROLE.USER).toBe('user');
    expect(MESSAGE_ROLE.ASSISTANT).toBe('assistant');
  });
});

describe('VOICE_INPUT_STATUS', () => {
  it('contains all voice input states', () => {
    expect(VOICE_INPUT_STATUS.IDLE).toBe('idle');
    expect(VOICE_INPUT_STATUS.RECORDING).toBe('recording');
    expect(VOICE_INPUT_STATUS.TRANSCRIBING).toBe('transcribing');
    expect(VOICE_INPUT_STATUS.ERROR).toBe('error');
    expect(VOICE_INPUT_STATUS.DISABLED).toBe('disabled');
  });

  it('is const-asserted', () => {
    const idle: 'idle' = VOICE_INPUT_STATUS.IDLE;
    expect(idle).toBe('idle');
  });
});

describe('Type inference', () => {
  it('PartType includes all part type values', () => {
    const value: PartType = 'text';
    expect(value).toBe('text');
  });

  it('ToolState includes all tool state values', () => {
    const value: ToolState = 'input-streaming';
    expect(value).toBe('input-streaming');
  });

  it('ChatStatus includes all chat status values', () => {
    const value: ChatStatus = 'ready';
    expect(value).toBe('ready');
  });

  it('MessageRole includes all message role values', () => {
    const value: MessageRole = 'tool';
    expect(value).toBe('tool');
  });

  it('VoiceInputStatus includes all voice input status values', () => {
    const value: VoiceInputStatus = 'recording';
    expect(value).toBe('recording');
  });
});
