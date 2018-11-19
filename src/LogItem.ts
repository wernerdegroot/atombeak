export const READ: 'READ' = 'READ'
export const WRITE: 'WRITE' = 'WRITE'

export type LogItem<Outer, Inner, Action> = ReadLogItem<Outer, Inner> | WriteLogItem<Inner, Action>

export type ReadLogItem<Outer, Inner> = Readonly<{
  type: typeof READ
  id: string,
  reader: (outer: Outer) => Inner
  value: Inner
}>

export type WriteLogItem<Inner, Action> = Readonly<{
  type: typeof WRITE 
  id: string,
  value: Inner
  action: Action
}>