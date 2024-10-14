import { createReducer, createSelector, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';
import { GUIElement } from '../gui-output/GUIModels';



interface TranslateResp {
  response: any,
  err: boolean,
  inp_code: string,
}

// ACTIONS
export const SidebarActions = createActionGroup({
  source: 'Sidebar',
  events: {
    'Toggle Sidebar': emptyProps(),
    'Set Sidebar': props<{ newState: boolean }>(),
    'GUI Variable Change': props<{ varname: string, value: any }>(),
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
    'Translate dice code Request': props<{ code: string }>(),
    'Translate dice code Respone': props<TranslateResp>(),
    'Set GUI Tree': props<{ element: GUIElement }>(),
  },
});

// REDUCER
interface State {
  sidebarVisible: boolean,
  diceExecResult: any,
  diceExecFailure: any,
  servTranslateRes: TranslateResp | null, 
  GUIVariables: { [varname: string]: any },
  GUITree: GUIElement | null,
};
const initialState: State = {
  sidebarVisible: false,
  diceExecResult: null,
  diceExecFailure: null,
  servTranslateRes: null,
  GUIVariables: {},
  GUITree: null,
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
    on(CodeApiActions.translateDiceCodeRespone, (state, response) => {
      return { ...state, servTranslateRes: response};
    }),
    on(SidebarActions.gUIVariableChange, (state, { varname, value }) => {
      return { ...state, GUIVariables: { ...state.GUIVariables, [varname]: value } };
    }),
    on(CodeApiActions.setGUITree, (state, { element }) => {
      return { ...state, GUITree: element };
    }),
  ),
  extraSelectors: (G) => ({
    selectSingleGUIVariable: (varname: string) => createSelector(G.selectGUIVariables, (GUIVariables) => {
      return GUIVariables[varname];
    }),
  }),
});

export const {
  name: herosFeatureKey,
  reducer: herosReducer,
} = feature

export const herosSelectors = {
  selectSidebarVisible: feature.selectSidebarVisible,
  selectDiceExecResult: feature.selectDiceExecResult,
  selectDiceExecFailure: feature.selectDiceExecFailure,
  selectServTranslateRes: feature.selectServTranslateRes,
  selectSingleGUIVariable: feature.selectSingleGUIVariable,
  selectGUITree: feature.selectGUITree,
};
