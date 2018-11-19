import { LogItem } from "../LogItem";
import { AbstractLog } from "../AbstractLog";

export class Log<Outer, Action> extends AbstractLog<Outer, Action> {
  append<Inner>(logItem: LogItem<Outer, Inner, Action>): void {
    this.itemsReversed.unshift(logItem)
  }
}