import { createReducer, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';


// ACTIONS
export const SidebarActions = createActionGroup({
  source: 'Sidebar',
  events: {
    'Toggle Sidebar': emptyProps(),
    'Set Sidebar': props<{ newState: boolean }>(),
  },
});

export const CodeApiActions = createActionGroup({
  source: 'Code API',
  events: {
    'Exec dice code Request': props<{ code: string }>(),
    'Exec dice code Success': props<{ response: any }>(),
    'Exec dice code Failure': props<{ error: any }>(),
    'Exec python code Request': props<{ code: string }>(),
    'Exec python code Success': props<{ response: any }>(),
    'Exec python code Failure': props<{ error: any }>(),
  },
});

// REDUCER
interface State {
  sidebarVisible: boolean,
  diceExecResult: any,
  diceExecFailure: any,
};
const initialState: State = {
  sidebarVisible: false,
  diceExecResult: null,
  diceExecFailure: null,
};

export const feature = createFeature({
  name: 'heros',
  reducer: createReducer(
    initialState,
    on(SidebarActions.toggleSidebar, state => {
      return { ...state, sidebarVisible: !state.sidebarVisible };
    }),
    on(SidebarActions.setSidebar, (state, { newState }) => {
      return { ...state, sidebarVisible: newState };
    }),
    on(CodeApiActions.execDiceCodeSuccess, CodeApiActions.execPythonCodeSuccess, (state, { response }) => {
      return { ...state, diceExecResult: response, diceExecFailure: null };
    }),
    on(CodeApiActions.execDiceCodeFailure, CodeApiActions.execPythonCodeFailure, (state, { error }) => {
      return { ...state, diceExecFailure: error, diceExecResult: null };
    }),
  ),
});

export const {
  name: herosFeatureKey,
  reducer: herosReducer,
} = feature

export const herosSelectors = {
  selectSidebarVisible: feature.selectSidebarVisible,
  selectDiceExecResult: feature.selectDiceExecResult,
  selectDiceExecFailure: feature.selectDiceExecFailure,
};
