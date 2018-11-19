import { Operation } from "./Operation";
import { GOOD } from "./Result";
import { Log } from "./Log";

export type Unsubscriber = () => void
export type Subscriber<Outer> = (onChange: (oldOuter: Outer, newOuter: Outer) => void) => Unsubscriber

export class Dispatchable<Outer, Inner, Action> {

  static isDispatchable<Outer, Inner, Action>(action: any): action is Dispatchable<Outer, Inner, Action> {
    return action instanceof Dispatchable
  }

  constructor(public readonly operation: Operation<Outer, Inner, Action>) {

  }

  handle(
    getOuter: () => Outer,
    dispatch: (actions: Action[]) => unknown,
    subscriber: Subscriber<Outer>) {
    const PENDING = 'PENDING'

    type Pending = {
      type: 'PENDING',
    }

    function pending(): Pending {
      return { type: PENDING }
    }

    const RETRY = 'RETRY'

    type Retry = {
      type: 'RETRY',
      oldLog: Log<Outer, Action>
      unsubscriber: Unsubscriber
    }

    function retry(oldLog: Log<Outer, Action>, unsubscriber: Unsubscriber): Retry {
      return { type: RETRY, oldLog, unsubscriber }
    }

    type State = Pending | Retry

    return new Promise<Inner>(resolve => {
      let state: State = pending()
      const iter = (originalOuter: Outer) => {
        state = pending()
        this.operation.execute(originalOuter, new Log([])).then(r => {
          const currentOuter = getOuter()
          if (r.type === GOOD) {
            if (r.log.hasNotChanged(currentOuter)) {
              dispatch(r.log.getActions())
              resolve(r.value)
            } else {
              iter(currentOuter)
            }
          } else if (r.type === RETRY) {
            if (Log.hasNotChanged(originalOuter, currentOuter, r.log)) {
              const unsubscriber = subscriber((oldOuter, newOuter) => {
                if (state.type === RETRY && !Log.hasNotChanged(oldOuter, newOuter, state.oldLog)) {
                  state.unsubscriber()
                  iter(newOuter)
                } 
              })
              state = retry(r.log, unsubscriber)
            } else {
              iter(currentOuter)
            }
          } else {
            const exhaustive: never = r
            throw new Error(exhaustive)
          }
        })
      }
      iter(getOuter())
    })
  }
}