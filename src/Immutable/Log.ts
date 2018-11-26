import { STATE, ReadLogItem, WriteLogItem, StateLogItem } from "../LogItem";
import { AbstractLog } from "../AbstractLog";

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

export class Log<Outer, Action> extends AbstractLog<Outer, Action> {

  static create<Outer, Action>(originalOuter: Outer): Log<Outer, Action> {
    return new Log([{type: STATE, outer: originalOuter}])
  }

  appendReadOrWrite<Inner>(logItem: ReadLogItem<Outer, Inner> | WriteLogItem<Inner, Action>): Log<Outer, Action> {
    return new Log([logItem, ...this.itemsReversed]) 
  }

  appendState(logItem: StateLogItem<Outer>): AppendResult<Outer, Action> {
    if (this.isConsistentWithOuter(logItem.outer)) {
      const newLog = new Log([logItem, ...this.itemsReversed])
      return appendSuccess(newLog)
    } else {
      return appendFailed(logItem.outer)
    }
  }
}