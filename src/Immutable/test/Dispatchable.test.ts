import { Lens } from "../../Lens";
import { Operation } from "../Operation";
import { Dispatchable, Subscriber } from "../Dispatchable";
import { TimeoutOperation } from "../TimeoutOperation";

describe('Dispatchable', () => {

  type Outer = {
    s: string
    n: number
  }

  type Action = {
    field: keyof Outer
    value: Outer[keyof Outer]
  }

  const nLens = new Lens<Outer, number, Action>(o => o.n, 'n', value => ({ field: 'n', value }))

  it('should dispatch all actions if no relevant changes have been made', async () => {
    let outer = { s: 'some string', n: 4 }
    const operation = Operation.pure<Outer, {}, Action>({})
      .assign('before', nLens.read())
      .assign('_', nLens.write(8))
      .assign('after', nLens.read())
    const dispatchable = new Dispatchable(operation)
    let actions: Action[] = []
    let listeners: Array<(oldOuter: Outer, newOuter: Outer) => void> = []
    const subscriber: Subscriber<Outer> = listener => {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    }
    const result = await Dispatchable.handle(dispatchable, () => outer, (newActions) => { actions = newActions }, subscriber)
    expect(result.before).toEqual(4)
    expect(result.after).toEqual(8)
    expect(actions).toEqual([{ field: 'n', value: 8 }])
  })

  it('should retry and finally dispatch all actions if changes have been made', async () => {
    let outer = { s: 'some string', n: 4 }
    const operation = Operation.pure<Outer, {}, Action>({})
      .assign('before', nLens.read())
      .assign('_', nLens.write(8))
      .assign('after', nLens.read())
      .assign('_', new TimeoutOperation(2000))
    const dispatchable = new Dispatchable(operation)
    let actions: Action[] = []
    let listeners: Array<(oldOuter: Outer, newOuter: Outer) => void> = []
    const subscriber: Subscriber<Outer> = listener => {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    }
    const resultPromise = Dispatchable.handle(dispatchable, () => outer, (newActions) => { actions = newActions }, subscriber)
    setTimeout(() => {
      outer = { s: 'some string', n: 5 }
    }, 1000)
    const result = await resultPromise
    expect(result.before).toEqual(5)
    expect(result.after).toEqual(8)
    expect(actions).toEqual([{ field: 'n', value: 8 }])
  })

  it('should retry and finally dispatch all actions if the operation prescribes to retry', async () => {
    let outer = { s: 'some string', n: 4 }
    const operation = Operation.pure<Outer, {}, Action>({})
      .assign('n', nLens.read())
      .flatMap(s => {
        if (s.n < 5) {
          return Operation.retry<Outer, { n: number, _: number }, Action>()
        } else {
          return nLens.write(8).map(_ => ({ ...s, _ }))
        }
      })
    const dispatchable = new Dispatchable(operation)
    let actions: Action[] = []
    let listeners: Array<(oldOuter: Outer, newOuter: Outer) => void> = []
    const subscriber: Subscriber<Outer> = listener => {
      listeners = [...listeners, listener]
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    }
    const resultPromise = Dispatchable.handle(dispatchable, () => outer, (newActions) => { actions = newActions }, subscriber)
    setTimeout(() => {
      const oldOuter = outer
      outer = { s: 'some string', n: 3 }
      listeners.forEach(listener => listener(oldOuter, outer))
    }, 1000)

    setTimeout(() => {
      const oldOuter = outer
      outer = { s: 'some string', n: 7 }
      listeners.forEach(listener => listener(oldOuter, outer))
    }, 2000)
    const result = await resultPromise
    expect(result.n).toEqual(7)
    expect(actions).toEqual([{ field: 'n', value: 8 }])
  })

})