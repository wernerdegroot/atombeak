import { Lens } from "../../Lens";
import { Log } from "../Log";
import { Operation } from "../Operation";
import { GOOD, RETRY } from "../Result";
import { READ } from "../../LogItem";
import { runAsPromise } from "../Trampoline";

describe('Context', () => {

  type Outer = {
    s: string
    n: number
  }

  type Action = {
    field: keyof Outer
    value: Outer[keyof Outer]
  }

  const sLens = new Lens<Outer, string, Action>(o => o.s, 's', value => ({ field: 's', value }))
  const nLens = new Lens<Outer, number, Action>(o => o.n, 'n', value => ({ field: 'n', value }))

  it('should return the current value when reading', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = sLens
      .read()

    return runAsPromise(operation, outer)
      .then(r => {
        if (r.type === GOOD) {
          expect(r.value).toEqual('some string')
        } else {
          fail()
        }
      })
  })

  it('should return the value written when reading after writing', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = sLens
      .write('some other string')
      .flatMap(() => {
        return sLens.read()
      })
    
    return runAsPromise(operation, outer)
      .then(r => {
        if (r.type === GOOD) {
          expect(r.value).toEqual('some other string')
        } else {
          fail()
        }
      })
  })

  it('should return the last value written when reading after writing many times', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = sLens
      .write('some other string')
      .flatMap(() => {
        return sLens.write('yet another string').flatMap(() => {
          return sLens.read()
        })
      })

    return runAsPromise(operation, outer)
      .then(r => {
        if (r.type === GOOD) {
          expect(r.value).toEqual('yet another string')
        } else {
          fail()
        }
      })
  })

  it('should claim the context is valid when nothing changed', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = nLens
      .read()

    return runAsPromise(operation, outer)
      .then(r => {
        expect(r.log.hasNotChanged(outer)).toEqual(true)
      })
  })

  it('should claim the context is valid when all values read are unchanged', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = nLens
      .read()

    const p = runAsPromise(operation, outer)
    outer = { s: 'some other string', n: 4 }
    return p.then(r => {
      expect(r.log.hasNotChanged(outer)).toEqual(true)
    })
  })

  it('should claim the context is invalid when one of the values read has changed', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = nLens
      .read()
      .flatMap(() => {
        return sLens.read()
      })
    const p = runAsPromise(operation, outer)
    outer = { s: 'some other string', n: 4 }
    return p.then(r => {
      expect(r.log.hasNotChanged(outer)).toEqual(false)
    })
  })

  it('should claim the context is valid when reading occurs after writing', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = sLens
      .write('some other string')
      .flatMap(() => {
        return sLens.read()
      })
    const p = runAsPromise(operation, outer)
    outer = { s: 'yet another string', n: 4 }
    return p.then(r => {
      expect(r.log.hasNotChanged(outer)).toEqual(true)
    })
  })

  it('should be able to build an object from many operations', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = Operation.pure<Outer, {}, Action>({})
      .assign('s', sLens.read())
      .assign('n', nLens.read())
      .assign('_', sLens.write('some other string'))
      .assign('_', nLens.write(9))
    
    return runAsPromise(operation, outer)
      .then(r => {
        if (r.type === GOOD) {
          const { s, n } = r.value
          expect(s).toEqual('some string')
          expect(n).toEqual(4)
        } else {
          fail()
        }
      })
  })

  it('should return a `Good` result when an operation does not need to be retried', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = nLens
      .read()
      .flatMap(n => {
        if (n !== 4) {
          return Operation.retry<Outer, number, Action>()
        } else {
          return Operation.pure(n)
        }
      })
      .flatMap(n => {
        return sLens.read()
      })
    const p = runAsPromise(operation, outer)
    return p.then(r => {
      if (r.type === GOOD) {
        expect(r.value).toEqual('some string')
        expect(r.log.itemsReversed).toEqual([{type: READ, id: sLens.id, value: 'some string', reader: sLens.reader}, {type: READ, id: nLens.id, value: 4, reader: nLens.reader}])
      } else {
        fail()
      }
    })
  })

  it('should return a `Retry` result when an operation needs to be retried', () => {
    let outer = { s: 'some string', n: 4 }
    const operation = nLens
      .read()
      .flatMap(n => {
        if (n === 4) {
          return Operation.retry<Outer, number, Action>()
        } else {
          return Operation.pure(n)
        }
      })
      .flatMap(n => {
        return sLens.read()
      })
    const p = runAsPromise(operation, outer)
    return p.then(r => {
      if (r.type === RETRY) {
        expect(r.log.itemsReversed).toEqual([{type: READ, id: nLens.id, value: 4, reader: nLens.reader}])
      } else {
        fail()
      }
    })
  })
})