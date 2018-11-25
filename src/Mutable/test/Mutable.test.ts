import { Context } from "../Context";
import { Lens } from "../../Lens";

describe('Mutable', () => {

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
    const outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    const s = context.read(sLens)
    expect(s).toEqual('some string')
  })

  it('should return the value written when reading after writing', () => {
    const outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    context.write(sLens, 'some other string')
    const s = context.read(sLens)
    expect(s).toEqual('some other string')
  })

  it('should return the last value written when reading after writing many times', () => {
    const outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    context.write(sLens, 'some other string')
    context.write(sLens, 'yet another string')
    const s = context.read(sLens)
    expect(s).toEqual('yet another string')
  })

  it('should return the original value, even if the outer value changed in the meantime', () => {
    let outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    outer = { s: 'some other string', n: 4 }
    const s = context.read(sLens)
    expect(s).toEqual('some string')
  })

  it('should claim the context is valid when nothing changed', () => {
    const outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    context.read(nLens)
    expect(context.hasNotChanged(outer)).toEqual(true)
  })

  it('should claim the context is valid when all values read are unchanged', () => {
    let outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    context.read(nLens)
    outer = { s: 'some other string', n: 4 }
    expect(context.hasNotChanged(outer)).toEqual(true)
  })

  it('should claim the context is invalid when one of the values read has changed', () => {
    let outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer)  
    context.read(nLens)
    context.read(sLens)
    outer = { s: 'some other string', n: 4 }
    expect(context.hasNotChanged(outer)).toEqual(false)
  })

  it('should claim the context is valid when reading occurs after writing', () => {
    let outer = { s: 'some string', n: 4 }
    const context = Context.fresh<Outer, Action>(outer) 
    context.write(sLens, 'some other string')
    context.read(sLens)
    outer = { s: 'yet another string', n: 4 }
    expect(context.hasNotChanged(outer)).toEqual(true)
  })
})