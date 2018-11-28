import { Outer, sLens, nLens } from './Data'
import { Log, APPEND_FAILED } from '../Log'
import { READ } from '../LogItem'

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
    if (appendResult.type === APPEND_FAILED) {
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
})
