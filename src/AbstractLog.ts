import { LogItem, WRITE, READ, STATE, ReadLogItem, WriteLogItem } from "./LogItem";
import { filterMap } from "./filterMap";

export abstract class AbstractLog<Outer, Action> {

  constructor(public readonly itemsReversed: LogItem<Outer, any, Action>[]) {

  }

  findMostRecentReadOrWrite(id: string): { value: any } | null {
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

  fromState<Inner>(reader: (outer: Outer) => Inner): Inner {
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
}