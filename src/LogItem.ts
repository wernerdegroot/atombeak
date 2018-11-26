export const READ: 'READ' = 'READ'

export type LogItem<Outer, Inner, Action> = ReadLogItem<Outer, Inner> | WriteLogItem<Inner, Action> | StateLogItem<Outer>

export type ReadLogItem<Outer, Inner> = Readonly<{
  type: typeof READ
  id: string,
  reader: (outer: Outer) => Inner
  value: Inner
}>

export const WRITE: 'WRITE' = 'WRITE'

export type WriteLogItem<Inner, Action> = Readonly<{
  type: typeof WRITE 
  id: string,
  value: Inner
  action: Action
}>

export const STATE: 'STATE' = 'STATE'

export type StateLogItem<Outer> = Readonly<{
  type: typeof STATE
  outer: Outer
}>