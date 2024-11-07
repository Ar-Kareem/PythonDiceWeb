import { createReducer, createSelector, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';
import { getVarNamesAndDefaults, GUIElement } from '@models/GUIModels';



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
    'Set GUI Tree': props<{ element: GUIElement }>(),
    'Set Current Response': props<{ response: any }>(),
  },
});

export const CodeApiActions = createActionGroup({
  source: 'Code API',
  events: {
    'Exec dice code Request': props<{ code: string, tabTitle: string }>(),
    'Exec dice code Success': props<{ response: any, tabTitle: string }>(),
    'Exec dice code Failure': props<{ error: any, inp_code: string, tabTitle: string }>(),
    'Exec python code Request': props<{ code: string, tabTitle: string }>(),
    'Exec python code Success': props<{ response: any, tabTitle: string }>(),
    'Exec python code Failure': props<{ error: any, inp_code: string, tabTitle: string }>(),
    'Translate dice code Request': props<{ code: string }>(),
    'Translate dice code Respone': props<TranslateResp>(),
    'Set Worker Status': props<{ status: string }>(),
    'Get Program Request': props<{ id: number|string }>(),
    'Get Program Success': props<{ response: any }>(),
    'Get Program Failure': props<{ error: any }>(),
    'Save Program Request': props<{ prog: string }>(),
    'Save Program Success': props<{ response: any }>(),
    'Save Program Failure': props<{ error: any }>(),
  },
});

// REDUCER
interface State {
  sidebarVisible: boolean,
  diceExecResult: { response: any, tabTitle: string }|null,
  diceExecFailure: { error: any, inp_code: string, tabTitle: string }|null,
  servTranslateRes: TranslateResp | null, 
  GUIVariables: { [varname: string]: any },
  GUITree: GUIElement | null,
  WorkerStatus: string|null,
  OutputResponse: any,
  progResponse: any,
};
const initialState: State = {
  sidebarVisible: false,
  diceExecResult: null,
  diceExecFailure: null,
  servTranslateRes: null,
  GUIVariables: {},
  GUITree: null,
  WorkerStatus: null,
  OutputResponse: null,
  progResponse: null,
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
    on(CodeApiActions.execDiceCodeSuccess, CodeApiActions.execPythonCodeSuccess, (state, payload) => {
      return { ...state, diceExecResult: payload, diceExecFailure: null };
    }),
    on(CodeApiActions.execDiceCodeFailure, CodeApiActions.execPythonCodeFailure, (state, payload) => {
      return { ...state, diceExecFailure: payload, diceExecResult: null };
    }),
    on(CodeApiActions.translateDiceCodeRespone, (state, response) => {
      return { ...state, servTranslateRes: response};
    }),
    on(SidebarActions.gUIVariableChange, (state, { varname, value }) => {
      // console.log('STORE CHANGE', varname, ':', state.GUIVariables[varname], '->', value);
      return { ...state, GUIVariables: { ...state.GUIVariables, [varname]: value } };
    }),
    on(SidebarActions.setGUITree, (state, { element }) => {
      const newGUIVariables: any = {};
      getVarNamesAndDefaults(element).forEach((defaultVal, varname) => {
        newGUIVariables[varname] = state.GUIVariables[varname] !== undefined ? state.GUIVariables[varname] : defaultVal;
      });
      // console.log('STORE RESET TREE. only keeping vars:', getVarNamesAndDefaults(element), newGUIVariables);
      return { ...state, GUITree: element, GUIVariables: newGUIVariables };
    }),
    on(CodeApiActions.setWorkerStatus, (state, { status }) => {
      return { ...state, WorkerStatus: status };
    }),
    on(SidebarActions.setCurrentResponse, (state, { response }) => {
      return { ...state, OutputResponse: response };
    }),
    on(CodeApiActions.getProgramSuccess, (state, { response }) => {
      return { ...state, progResponse: {command: 'get', status: 'success', response} };
    }),
    on(CodeApiActions.getProgramFailure, (state, { error }) => {
      return { ...state, progResponse: {command: 'get', status: 'error', error} };
    }),
    on(CodeApiActions.saveProgramSuccess, (state, { response }) => {
      return { ...state, progResponse: {command: 'save', status: 'success', response} };
    }),
    on(CodeApiActions.saveProgramFailure, (state, { error }) => {
      return { ...state, progResponse: {command: 'save', status: 'error', error} };
    }),
  ),
});

export const factorySelectSingleGUIVariable = (varname: string) => createSelector(feature.selectGUIVariables, (GUIVariables) => {
  // console.log('SELECTOR CHECK?', varname, GUIVariables[varname]);
  return GUIVariables[varname];
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
  selectGUIVariables: feature.selectGUIVariables,
  selectGUITree: feature.selectGUITree,
  selectWorkerStatus: feature.selectWorkerStatus,
  selectOutputResponse: feature.selectOutputResponse,
  selectProgResponse: feature.selectProgResponse,
  factorySelectSingleGUIVariable: factorySelectSingleGUIVariable,
};
