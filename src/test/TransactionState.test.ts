import { Log } from "../Log";
import { Outer, Action, nLens } from "./Data";
import { Retry } from "../Execution/TransactionState";
import { outerChangedMessage } from "../Execution/Message";
import { noOp } from "../Execution/Command";

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
  })
})