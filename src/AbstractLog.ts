import { LogItem, WRITE, READ } from "./LogItem";

export abstract class AbstractLog<Outer, Action> {

  static hasNotChanged<Outer, Action>(oldOuter: Outer, newOuter: Outer, oldLog: AbstractLog<Outer, Action>): boolean {
    return oldLog.itemsReversed.every(i => {
      if (i.type === WRITE) {
        return true
      } else if (i.type === READ) {
        return i.reader(oldOuter) === i.reader(newOuter)
      } else {
        const exhaustive: never = i
        throw new Error(exhaustive)
      }
    })
  }

  constructor(public readonly itemsReversed: LogItem<Outer, any, Action>[]) {

  }

  findMostRecent(id: string): { value: any } | false {
    const itemWithSamePath = this.itemsReversed.find(item => item.id === id)
    if (itemWithSamePath === undefined) {
      return false
    } else {
      return { value: itemWithSamePath.value }
    }
  }
  
  hasNotChanged(outer: Outer): boolean {
    return this.itemsReversed.every(i => {
      if (i.type === WRITE) {
        return true
      } else if (i.type === READ) {
        return i.reader(outer) === i.value
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
        actions.push(item.action)
      }
    })
    return actions
  }
}