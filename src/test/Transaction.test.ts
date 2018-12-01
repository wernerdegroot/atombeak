import { TVar } from '../TVar'
import { Operation } from '../Operation/Operation'
import { Transaction } from '../Execution/Transaction'
import { testClock } from '../Operation/Clock'

describe('Transaction', () => {
  function flushPromises() {
    return new Promise(resolve => setImmediate(resolve))
  }

  type Outer = {
    accountBalance: number
  }
  type Action = (outer: Outer) => Outer
  const accountBalance: TVar<Outer, number, Action> = new TVar(o => o.accountBalance, 'accountBalance', b => (outer: Outer) => ({ ...outer, accountBalance: b }))
  let outer: Outer = {
    accountBalance: 1000
  }

  it('should run to completion when the `Outer` is stable', async () => {
    const clock = testClock(0)
    const withdrawFiveHundred: Operation<Outer, number, Action> = accountBalance
      .read()
      .flatMap(b => accountBalance.write(b - 500).flatMap(() => Operation.timeout<Outer, Action>(5000, clock).flatMap(() => accountBalance.read())))
    const transaction = new Transaction<Outer, number, Action>(withdrawFiveHundred, outer, action => {
      outer = action(outer)
    })
    expect(transaction.isDone).toEqual(false)
    await flushPromises()
    clock.setTime(5001)
    await flushPromises()
    expect(transaction.isDone).toEqual(true)
    expect(outer).toEqual({ accountBalance: 500 })
  })
})
