import { LogItem } from "../LogItem";
import { AbstractLog } from "../AbstractLog";

export class Log<Outer, Action> extends AbstractLog<Outer, Action> {
  append<Inner>(logItem: LogItem<Outer, Inner, Action>): Log<Outer, Action> {
    return new Log([logItem, ...this.itemsReversed])
  }
}