import { Middleware, Action } from 'redux'
import { Operation } from './Operation/Operation'
import { Transaction } from './Execution/Transaction'
import { outerChangedMessage } from './Execution/Message'

export interface DispatchOperation<AppState> {
  <Inner>(operation: Operation<AppState, Inner, Action>): void
}

export const createMiddleware = <AppState>(): Middleware<DispatchOperation<AppState>, AppState> => api => next => {
  let transactions: Array<Transaction<AppState, any, Action>> = []
  return action => {
    if (Operation.isOperation<AppState, any, Action>(action)) {
      transactions.push(new Transaction<AppState, any, Action>(action, api.getState(), api.dispatch))
    } else {
      transactions = transactions.filter(transaction => !transaction.isDone)
      const oldOuter = api.getState()
      const result = next(action)
      const newOuter = api.getState()
      transactions.forEach(transaction => {
        transaction.push(outerChangedMessage(oldOuter, newOuter))
      })
      return result
    }
  }
}
