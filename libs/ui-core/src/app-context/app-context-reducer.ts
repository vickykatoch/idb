export function appContextReducer(state: any, action: any) {
  switch (action.type) {
    case 'SET_APP_NAME':
      return {
        ...state,
        appName: action.payload,
      };
    default:
      return state;
  }
}
