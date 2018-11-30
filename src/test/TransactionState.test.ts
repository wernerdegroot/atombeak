import { Log, restartWithOuter } from "../Log";
import { Outer, Action, nLens } from "./Data";
import { Retry, Pending } from "../Execution/TransactionState";
import { outerChangedMessage, resultReceivedMessage, nextIteration } from "../Execution/Message";
import { noOp, shouldRestart } from "../Execution/Command";
import { good } from "../Result";

describe('TransactionState', () => {

  const originalOuter: Outer = { s: 'some string', n: 4 }
  const logWhenNReadAsFour = Log.create<Outer, Action>(originalOuter).read(nLens.id, nLens.reader)[1]

  describe('Retry', () => {
    it('should stay in `Retry` state when `Outer` does not change in a meaningfull way', () => {
      const state: Retry<Outer, number, Action> = new Retry(0, logWhenNReadAsFour)
      const newOuter: Outer = { s: 'some other string', n: 4 }
      const newState = state.next(outerChangedMessage(originalOuter, newOuter))
      expect(newState).toEqual([new Retry<Outer, number, Action>(0, logWhenNReadAsFour), noOp])
    })

    it('should move to `Pending` state when `Outer` changed in a meaningfull way', () => {
      const state: Retry<Outer, number, Action> = new Retry(0, logWhenNReadAsFour)
      const newOuter: Outer = { s: 'some other string', n: 5 }
      const newState = state.next(outerChangedMessage(originalOuter, newOuter))
      expect(newState).toEqual([new Pending<Outer, number, Action>(1, Log.create(newOuter), []), shouldRestart(1, Log.create(newOuter))])
    })

    it('should ignore messages indicating a result was received', () => {
      const state: Retry<Outer, number, Action> = new Retry(0, logWhenNReadAsFour)
      const otherOuter: Outer = { s: 'some other string', n: 5 }
      const newState = state.next(resultReceivedMessage(8, good(5, Log.create(otherOuter))))
      expect(newState).toEqual([new Retry<Outer, number, Action>(0, logWhenNReadAsFour), noOp])
    })

    it('should ignore messages indicating that next iterations were executed', () => {
      const state: Retry<Outer, number, Action> = new Retry(0, logWhenNReadAsFour)
      const otherOuter: Outer = { s: 'some other string', n: 5 }
      const newState = state.next(nextIteration(4, Log.create(otherOuter)))
      expect(newState).toEqual([new Retry<Outer, number, Action>(0, logWhenNReadAsFour), noOp])
    })
  })
})