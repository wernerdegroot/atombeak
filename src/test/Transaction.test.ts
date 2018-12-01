import { TVar } from '../TVar'
import { Operation } from '../Operation/Operation'
import { Transaction } from '../Execution/Transaction'
import { testClock } from '../Operation/Clock'
import { outerChangedMessage } from '../Execution/Message'

describe('Transaction', () => {
  function flushPromises() {
    return new Promise(resolve => setImmediate(resolve))
  }

  type Outer = {
    accountBalance: number
  }
  type Action = (outer: Outer) => Outer
  const accountBalance: TVar<Outer, number, Action> = new TVar(o => o.accountBalance, 'accountBalance', b => (outer: Outer) => ({ ...outer, accountBalance: b }))

  it('should run to completion when the `Outer` is stable', async () => {
    // Account with a balance of 1000:
    let outer: Outer = {
      accountBalance: 1000
    }

    const clock = testClock(0)

    // An operation that withdraws 500 from the account, but
    // waits 5 seconds before committing:
    const withdrawFiveHundred: Operation<Outer, number, Action> = accountBalance
      .read()
      .flatMap(b => accountBalance.write(b - 500))
      .flatMap(() => Operation.timeout<Outer, Action>(5000, clock))
      .flatMap(() => accountBalance.read())

    // Start the transaction:
    const transaction = new Transaction<Outer, number, Action>(withdrawFiveHundred, outer, action => {
      outer = action(outer)
    })

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction shouldn't be finished yet, as the transaction
    // needs at least 5 seconds to complete:
    expect(transaction.isDone).toEqual(false)

    // Wait for 5 seconds:
    clock.setTime(5000)

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction should be finished now:
    expect(transaction.isDone).toEqual(true)
    expect(outer).toEqual({ accountBalance: 500 })
  })

  it('should retry until the `Outer` is as desired', async () => {
    // Account with a balance of 200 (not enough to withdraw 500):
    let outer: Outer = {
      accountBalance: 200
    }

    const clock = testClock(0)

    // An operation that withdraws 500 from the account, but
    // waits 5 seconds before committing. The operation will
    // retry if there isn't enough money in the account to
    // withdraw 500:
    const withdrawFiveHundredIfAvailable: Operation<Outer, number, Action> = accountBalance
      .read()
      .flatMap(b => {
        if (b < 500) {
          return Operation.retry<Outer, number, Action>()
        } else {
          return accountBalance.write(b - 500)
        }
      })
      .flatMap(() => Operation.timeout<Outer, Action>(5000, clock))
      .flatMap(() => accountBalance.read())

    // Start the transaction:
    const transaction = new Transaction<Outer, number, Action>(withdrawFiveHundredIfAvailable, outer, action => {
      outer = action(outer)
    })

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction shouldn't be finished yet, as the transaction
    // needs at least 5 seconds to complete:
    expect(transaction.isDone).toEqual(false)

    // Wait 5 seconds:
    clock.setTime(5000)

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction *still* shouldn't be finished, as there isn't enough
    // money in the account to complete the transaction:
    expect(transaction.isDone).toEqual(false)

    // Update the `Outer`. This time, the account contains enough
    // money so the transaction will restart:
    const oldOuter = outer
    outer = {
      accountBalance: 1000
    }
    transaction.push(outerChangedMessage(oldOuter, outer))

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction shouldn't be finished yet, as the transaction
    // needs at least 5 seconds to complete:
    expect(transaction.isDone).toEqual(false)

    // Wait for another 5 seconds:
    clock.setTime(10000)

    // Make sure all `Promise<..>` that *can* be resolved, are resolved:
    await flushPromises()

    // The transaction should be finished now:
    expect(transaction.isDone).toEqual(true)
    expect(outer).toEqual({ accountBalance: 500 })
  })
})
