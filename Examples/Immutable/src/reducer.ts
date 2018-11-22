import { combineReducers } from 'redux'
import { AppState } from './AppState';
import { logReducer } from './logReducer';
import { forksReducer } from './forksReducer';
import { Action } from './actions';

export const reducer = combineReducers<AppState, Action>({
  forks: forksReducer,
  log: logReducer
})