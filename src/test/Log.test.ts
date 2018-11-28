import { Outer, sLens, nLens } from './Data'
import { Log, RESTART_WITH_OUTER, APPEND_SUCCESS } from '../Log'
import { READ, WRITE, STATE } from '../LogItem'

describe('Log', () => {
  it('should use the first `Outer` for read operations if no other `Outer`-instances are available', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    const log = Log.create(firstOuter)
    const [s] = log.read(sLens.id, sLens.reader)
    expect(s).toEqual('some string')
  })

  it('should use the next `Outer`-instances for read operations if they are available', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    const secondOuter: Outer = { s: 'some other string', n: 4 }
    let log = Log.create(firstOuter)

    const appendResult = log.appendState(secondOuter)
    if (appendResult.type === RESTART_WITH_OUTER) {
      return fail()
    }
    log = appendResult.log

    const [s] = log.read(sLens.id, sLens.reader)
    expect(s).toEqual('some other string')
  })

  it('should record each read operation in the log', () => {
    const outer: Outer = { s: 'some string', n: 4 }
    let log = Log.create(outer)
    const sReadResult = log.read(sLens.id, sLens.reader)
    log = sReadResult[1]
    const nReadResult = log.read(nLens.id, nLens.reader)
    log = nReadResult[1]
    expect(log.itemsReversed).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: READ, id: nLens.id, value: 4 }), expect.objectContaining({ type: READ, id: sLens.id, value: 'some string' })])
    )
  })

  it('should record each write operation in the log', () => {
    const outer: Outer = { s: 'some string', n: 4 }
    let log = Log.create(outer)
    log = log.write(sLens.id, 'some other string', sLens.toAction('some other string'))
    log = log.write(nLens.id, 8, nLens.toAction(8))
    expect(log.itemsReversed).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: WRITE, id: nLens.id, value: 8 }), expect.objectContaining({ type: WRITE, id: sLens.id, value: 'some other string' })])
    )
  })

  it('should contain an action for each write operation (in the correct order!)', () => {
    const outer: Outer = { s: 'some string', n: 4 }
    let log = Log.create(outer)
    log = log.write(sLens.id, 'some other string', sLens.toAction('some other string'))
    log = log.write(nLens.id, 8, nLens.toAction(8))
    expect(log.getActions()).toEqual([sLens.toAction('some other string'), nLens.toAction(8)])
  })

  it('should reject `Outer` that is inconsistent with performed reads', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    let log = Log.create(firstOuter)
    const readResult = log.read(sLens.id, sLens.reader)
    log = readResult[1]
    const secondOuter: Outer = { s: 'some other string', n: 4 }
    const appendResult = log.appendState(secondOuter)
    if (appendResult.type === APPEND_SUCCESS) {
      return fail()
    }
    expect(appendResult.type).toEqual(RESTART_WITH_OUTER)
    expect(appendResult.outer).toEqual(secondOuter)
  })

  it('should accept `Outer` that is consistent with performed reads', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    let log = Log.create(firstOuter)
    const readResult = log.read(nLens.id, nLens.reader)
    log = readResult[1]
    const secondOuter: Outer = { s: 'some other string', n: 4 }
    const appendResult = log.appendState(secondOuter)
    if (appendResult.type === RESTART_WITH_OUTER) {
      return fail()
    }
    expect(appendResult.type).toEqual(APPEND_SUCCESS)
    expect(appendResult.log.itemsReversed).toEqual(expect.arrayContaining([expect.objectContaining({ type: STATE, outer: secondOuter })]))
  })

  it('should reject all `Outer`-instances that are inconsistent with performed reads, and return the last `Outer` (even if that `Outer` is valid)', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    let log = Log.create(firstOuter)
    const readResult = log.read(sLens.id, sLens.reader)
    log = readResult[1]
    const secondOuter: Outer = { s: 'some other string', n: 4 }
    const thirdOuter: Outer = { s: 'some string', n: 8 }
    const appendResult = log.appendStates(secondOuter, thirdOuter)
    if (appendResult.type === APPEND_SUCCESS) {
      return fail()
    }
    expect(appendResult.type).toEqual(RESTART_WITH_OUTER)
    expect(appendResult.outer).toEqual(thirdOuter)
  })

  it('should accept all `Outer`-instances that are consistent with performed reads', () => {
    const firstOuter: Outer = { s: 'some string', n: 4 }
    let log = Log.create(firstOuter)
    const readResult = log.read(nLens.id, nLens.reader)
    log = readResult[1]
    const secondOuter: Outer = { s: 'some other string', n: 4 }
    const thirdOuter: Outer = { s: 'yet another string', n: 4 }
    let appendResult = log.appendStates(secondOuter, thirdOuter)
    if (appendResult.type === RESTART_WITH_OUTER) {
      return fail()
    }
    expect(appendResult.type).toEqual(APPEND_SUCCESS)
    expect(appendResult.log.itemsReversed).toEqual(expect.arrayContaining([expect.objectContaining({ type: STATE, outer: secondOuter })]))
  })
})
