import { Middleware } from "redux";
import { Immutable } from 'atombeak'
import { AppState } from "./AppState";
import { Action } from "./actions";
import { stateChangedMessage } from "atombeak/dist/Immutable/Execution/Message";

export interface DispatchDispatchable {
  <Inner>(dispatchable: Immutable.Dispatchable<AppState, Inner, Action>): Promise<Inner>
}

export const middleware: Middleware<DispatchDispatchable, AppState> = api => next => {
  let queues: Array<Immutable.Queue<AppState, any, Action>> = []
  return action => {
    if (Immutable.Dispatchable.isDispatchable<AppState, any, Action>(action)) {
      queues.push(new Immutable.Queue(action.operation, api.getState, api.dispatch))
    } else {
      queues = queues.filter(queue => !queue.isDone)
      const oldOuter = api.getState()
      const result = next(action)
      const newOuter = api.getState()
      queues.forEach(queue => {
        queue.push(stateChangedMessage(oldOuter, newOuter))
      })
      return result
    }
  }
}