import { createReducer, createSelector, on } from '@ngrx/store';
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { createFeature } from '@ngrx/store';


interface IMessage {
  title: string;
  message: string;
}
interface ICallback {
  onConfirm: () => void;
  onReject: () => void;
}

// ACTIONS

export const ToastActions = createActionGroup({
  source: 'Toast',
  events: {
    'Add Loading Request': emptyProps(),
    'Remove Loading Request': emptyProps(),
    'Error Notification': props<IMessage>(),
    'Warning Notification': props<IMessage>(),
    'Success Notification': props<IMessage>(),
    'Dialog Notification': props<IMessage & { callback: ICallback }>(),
    'Dialog Only Dismiss Notification': props<IMessage & { callback: ICallback }>(),
  },
});

// REDUCER
interface State {
  loadingRequests: number;
  message: IMessage | null,
  type: string,
  visible: boolean,
  callback: ICallback | null,
};
const initialState: State = {
  loadingRequests: 0,
  message: null,
  type: '',
  visible: false,
  callback: null,
};

const feature = createFeature({
  name: 'toast',
  reducer: createReducer(
    initialState,
    on(ToastActions.addLoadingRequest, (state) => {
      return { ...state, loadingRequests: state.loadingRequests + 1 };
    }),
    on(ToastActions.removeLoadingRequest, (state) => {
      return { ...state, loadingRequests: state.loadingRequests - 1 };
    }),
    on(ToastActions.errorNotification, (state, message) => {
      return { ...state, message: message, type: 'error', visible: true };
    }),
    on(ToastActions.warningNotification, (state, message) => {
      return { ...state, message: message, type: 'warn', visible: true };
    }),
    on(ToastActions.successNotification, (state, message) => {
      return { ...state, message: message, type: 'success', visible: true };
    }),
    on(ToastActions.dialogNotification, (state, message) => {
      return { ...state, message: message, type: 'dialog', visible: true, callback: message.callback };
    }),
    on(ToastActions.dialogOnlyDismissNotification, (state, message) => {
      return { ...state, message: message, type: 'dialog-dismiss', visible: true, callback: message.callback };
    }),
  ),
  extraSelectors: ({ selectLoadingRequests, selectMessage, selectType, selectVisible, selectCallback }) => ({
    selectIsLoading: createSelector(selectLoadingRequests, (loadingRequests) => loadingRequests > 0),
    selectMsgServiceState: createSelector(selectMessage, selectType, selectVisible, selectCallback, 
      (message, type, visible, callback) => ({ message, type, visible, callback })),
  }),
});

export const {
  name: toastFeatureKey,
  reducer: toastReducer,
  selectToastState,
  selectIsLoading,
  selectMsgServiceState,
} = feature;

