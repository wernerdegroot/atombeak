import { combineReducers } from 'redux'
import { StoreState } from './StoreState'
import { logReducer } from './logReducer'
import { forksReducer } from './forksReducer'
import { Action } from './actions'

export const reducer = combineReducers<StoreState, Action>({
  forks: forksReducer,
  log: logReducer
})
