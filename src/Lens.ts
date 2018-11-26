import { ReadOperation } from "./Operation/ReadOperation";
import { WriteOperation } from "./Operation/WriteOperation";

export class Lens<Outer, Inner, Action> {

  constructor(
    public readonly reader: (outer: Outer) => Inner,
    public readonly id: string,
    public readonly toAction: (inner: Inner) => Action
  ) { }

  read(): ReadOperation<Outer, Inner, Action> {
    return new ReadOperation(this.reader, this.id)
  }

  write(inner: Inner): WriteOperation<Outer, Inner, Action> {
    return new WriteOperation(inner, this.id, this.toAction(inner))
  }
}