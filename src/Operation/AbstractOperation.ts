import { Operation } from "./Operation";
import { Log } from "../Log";
import { MappedOperation } from "./internal";
import { FlatMappedOperation } from "./internal";
import { Trampoline } from "../Trampoline";

export abstract class AbstractOperation<Outer, Inner, Action> implements Operation<Outer, Inner, Action> {
  abstract execute(log: Log<Outer, Action>): Trampoline<Outer, Inner, Action>

  map<NewInner>(fn: (inner: Inner) => NewInner): Operation<Outer, NewInner, Action> {
    return new MappedOperation(this, fn)
  }

  flatMap<NewInner>(fn: (inner: Inner) => Operation<Outer, NewInner, Action>): Operation<Outer, NewInner, Action> {
    return new FlatMappedOperation(this, fn)
  }

  assign<Inner extends object, K extends string | number | symbol, V>(this: Operation<Outer, Inner, Action>, key: K, valueOperation: Operation<Outer, V, Action>): Operation<Outer, Inner & { [KK in K]: V }, Action> {
    return this.flatMap(inner => {
      return valueOperation.map(value => {
        return { ...inner as any, [key]: value }
      })
    })
  }
}