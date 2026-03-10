export { selectRealtimeConfig } from './realtimeSelectors';
export type { RealtimeConfig } from './realtimeTypes';
export { ActionCableReconnectService } from './realtimeReconnectService';
export { ActionCableService } from './realtimeService';
export { useRealtime } from './useRealtime';
export { RealtimeGate } from './RealtimeGate';
// NOTE: Cross-feature import exception — realtimeReconnectService imports
// conversationActions and selectFilters from conversation/. This is documented
// as an acceptable pragmatic exception per the architecture proposal (§4.7).
