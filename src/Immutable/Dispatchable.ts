import { Operation } from "./Operation";

export class Dispatchable<Outer, Inner, Action> {

  static isDispatchable<Outer, Inner, Action>(action: any): action is Dispatchable<Outer, Inner, Action> {
    return action instanceof Dispatchable
  }

  constructor(public readonly operation: Operation<Outer, Inner, Action>) {

  }
}