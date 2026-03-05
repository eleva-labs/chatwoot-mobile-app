import type { RootState } from '@application/store';
import { macroAdapter } from './macroSlice';

export const selectMacrosState = (state: RootState) => state.macros;

export const { selectAll: selectAllMacros } = macroAdapter.getSelectors(selectMacrosState);
