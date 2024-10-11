import { createReducer, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';

// STATE
export interface ITab {
  title: string,
  closable?: boolean,
};

interface State {
  activeIndex: number,
  allowedNewTabs: string[],
  openTabs: ITab[],
};
const initialState: State = {
  activeIndex: 0,
  allowedNewTabs: [],
  openTabs: [],
};

// ACTIONS
export const tabviewActions = createActionGroup({
  source: 'Tab View API',
  events: {
    'Change Active Index': props<{ newIndex: number }>(),
    'Change Allowed New Tabs': props<{ allowedNewTabs: string[] }>(),
    'Change Open Tabs': props<{ openTabs: ITab[] }>(),
  },
});

// REDUCER
export const feature = createFeature({
  name: 'tabview',
  reducer: createReducer(
    initialState,
    on(tabviewActions.changeActiveIndex, (state, { newIndex }) => {
      return { ...state, activeIndex: newIndex };
    }),
    on(tabviewActions.changeAllowedNewTabs, (state, { allowedNewTabs }) => {
      return { ...state, allowedNewTabs: allowedNewTabs };
    }),
    on(tabviewActions.changeOpenTabs, (state, { openTabs }) => {
      return { ...state, openTabs: openTabs };
    }),
  ),
});

export const {
  name: tabviewFeatureKey,
  reducer: tabviewReducer,
  selectTabviewState,
} = feature

export const tabviewSelectors = {
  selectActiveIndex: feature.selectActiveIndex,
  selectAllowedNewTabs: feature.selectAllowedNewTabs,
  selectOpenTabs: feature.selectOpenTabs,
};
