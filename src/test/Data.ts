import { TVar } from '../TVar'

export type Outer = {
  s: string
  n: number
}

export type Action = {
  field: keyof Outer
  value: Outer[keyof Outer]
}

export const sLens = new TVar<Outer, string, Action>(o => o.s, 's', value => ({ field: 's', value }))
export const nLens = new TVar<Outer, number, Action>(o => o.n, 'n', value => ({ field: 'n', value }))
