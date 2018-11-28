import { Lens } from '../Lens'

export type Outer = {
  s: string
  n: number
}

export type Action = {
  field: keyof Outer
  value: Outer[keyof Outer]
}

export const sLens = new Lens<Outer, string, Action>(o => o.s, 's', value => ({ field: 's', value }))
export const nLens = new Lens<Outer, number, Action>(o => o.n, 'n', value => ({ field: 'n', value }))
