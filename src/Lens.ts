import * as Immutable from "./Immutable";

export class Lens<Outer, Inner, Action> {

  constructor(
    public readonly reader: (outer: Outer) => Inner,
    public readonly id: string,
    public readonly toAction: (inner: Inner) => Action
  ) { }

  read(): Immutable.ReadOperation<Outer, Inner, Action> {
    return new Immutable.ReadOperation(this.reader, this.id)
  }

  write(inner: Inner): Immutable.WriteOperation<Outer, Inner, Action> {
    return new Immutable.WriteOperation(inner, this.id, this.toAction(inner))
  }
}