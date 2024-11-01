import { createReducer, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';
import { TabTitles } from './tabview.component';

// STATE
export interface ITab {
  title: string,
  closable?: boolean,
};

interface State {
  activeIndex: number,
  allowedNewTabs: string[],
  openTabs: ITab[],
  selectedTab: ITab | null,
};
const initialState: State = {
  activeIndex: 0,
  allowedNewTabs: [],
  openTabs: [],
  selectedTab: null,
};

// ACTIONS
export const tabviewActions = createActionGroup({
  source: 'Tab View API',
  events: {
    'Change Active Index': props<{ newIndex: number }>(),
    'Change Allowed New Tabs': props<{ allowedNewTabs: string[] }>(),
    'Change Open Tabs': props<{ openTabs: ITab[], newIndex?: number }>(),
    'To Python Button Clicked': emptyProps(),
    'Share Code Button Clicked': props<{ tabTitles: string[] }>(),
  },
});

// REDUCER
export const feature = createFeature({
  name: 'tabview',
  reducer: createReducer(
    initialState,
    on(tabviewActions.changeActiveIndex, (state, { newIndex }) => {
      return { ...state, activeIndex: newIndex, selectedTab: state.openTabs[newIndex] };
    }),
    on(tabviewActions.changeAllowedNewTabs, (state, { allowedNewTabs }) => {
      return { ...state, allowedNewTabs: allowedNewTabs };
    }),
    on(tabviewActions.changeOpenTabs, (state, { openTabs, newIndex }) => {
      // if GUI editor open then Show GUI output tab
      const curTabTitles = openTabs.map(tab => tab.title);
      if (curTabTitles.includes(TabTitles.GUI) && !curTabTitles.includes(TabTitles.GUISHOW)) {
        openTabs = [...openTabs, {title: TabTitles.GUISHOW}];
      }
      if (newIndex !== undefined) {
        return { ...state, openTabs: openTabs, activeIndex: newIndex, selectedTab: openTabs[newIndex] };
      }
      return { ...state, openTabs: openTabs, selectedTab: openTabs[state.activeIndex] };
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
  selectSelectedTab: feature.selectSelectedTab,
};
