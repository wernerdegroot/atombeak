import { STATE, ReadLogItem, WriteLogItem, StateLogItem, LogItem, READ, WRITE } from "../LogItem";
import { filterMap } from "../filterMap";

export const APPEND_SUCCESS: 'APPEND_SUCCESS' = 'APPEND_SUCCESS'

export type AppendSucces<Outer, Action> = Readonly<{
  type: typeof APPEND_SUCCESS
  log: Log<Outer, Action>
}>

export function appendSuccess<Outer, Action>(log: Log<Outer, Action>): AppendSucces<Outer, Action> {
  return {
    type: APPEND_SUCCESS,
    log
  }
}

export const APPEND_FAILED: 'APPEND_FAILED' = 'APPEND_FAILED'

export type AppendFailed<Outer> = Readonly<{
  type: typeof APPEND_FAILED
  outer: Outer
}>

export function appendFailed<Outer>(outer: Outer): AppendFailed<Outer> {
  return {
    type: APPEND_FAILED,
    outer
  }
}

export type AppendResult<Outer, Action> = AppendSucces<Outer, Action> | AppendFailed<Outer>

export class Log<Outer, Action> {
  
  static create<Outer, Action>(originalOuter: Outer): Log<Outer, Action> {
    return new Log([{type: STATE, outer: originalOuter}])
  }

  constructor(public readonly itemsReversed: LogItem<Outer, any, Action>[]) {
    
  }

  public read<Inner>(id: string, reader: (outer: Outer) => Inner): [Inner, Log<Outer, Action>] {
    const fromLog = this.findMostRecentReadOrWrite(id)
    if (fromLog === null) {
      const inner = this.fromState(reader)
      const updatedLog = this.appendReadOrWrite({type: READ, id, reader, value: inner})
      return [inner, updatedLog]
    } else {
      return [fromLog.value, this]
    }
  }

  private findMostRecentReadOrWrite(id: string): { value: any } | null {
    const readsOrWritesReversed = filterMap(
      this.itemsReversed,
      (item) => {
      if (item.type === READ || item.type === WRITE) {
        return item
      } else {
        return null
      }
    })
    const itemWithSamePath = readsOrWritesReversed.find(item => item.id === id)
    if (itemWithSamePath === undefined) {
      return null
    } else {
      return { value: itemWithSamePath.value }
    }
  }

  private fromState<Inner>(reader: (outer: Outer) => Inner): Inner {
    const statesReversed = filterMap(
      this.itemsReversed,
      item => {
        if (item.type === STATE) {
          return item
        } else {
          return null
        }
      }
    )
    const mostRecentState = statesReversed[0]
    if (mostRecentState === undefined) {
      throw new Error('Expected at least one state (the original state).')
    }

    return reader(mostRecentState.outer)
  }
  
  public write<Inner>(id: string, inner: Inner, action: Action): Log<Outer, Action> {
    return this.appendReadOrWrite({type: WRITE, id, value: inner, action})
  }  
  
  private appendReadOrWrite<Inner>(logItem: ReadLogItem<Outer, Inner> | WriteLogItem<Inner, Action>): Log<Outer, Action> {
    return new Log([logItem, ...this.itemsReversed]) 
  }

  isConsistentWithOuter(outer: Outer): boolean {
    return this.itemsReversed.every(i => {
      if (i.type === WRITE) {
        return true
      } else if (i.type === READ) {
        return i.reader(outer) === i.value
      } else if (i.type === STATE) {
        return true
      } else {
        const exhaustive: never = i
        throw new Error(exhaustive)
      }  
    })  
  }   

  getActions(): Action[] {
    const actions: Action[] = []
    this.itemsReversed.forEach(item => {
      if (item.type === WRITE) {
        actions.unshift(item.action)
      }  
    })  
    return actions
  }  

  public appendState(outer: Outer): AppendResult<Outer, Action> {
    const logItem: StateLogItem<Outer> = {type: STATE, outer}
    if (this.isConsistentWithOuter(logItem.outer)) {
      const newLog = new Log([logItem, ...this.itemsReversed])
      return appendSuccess(newLog)
    } else {
      return appendFailed(logItem.outer)
    }
  }

  public appendStates(...outers: Outer[]): AppendResult<Outer, Action> {
    return outers.reduce<AppendResult<Outer, Action>>((acc, curr) => {
      if (acc.type === APPEND_SUCCESS) {
        return acc.log.appendState(curr)
      } else if(acc.type === APPEND_FAILED) {
        return appendFailed(curr)
      } else {
        const exhaustive: never = acc
        throw new Error(exhaustive)
      }
    }, appendSuccess(this))
  }
}