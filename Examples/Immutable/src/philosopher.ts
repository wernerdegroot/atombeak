import { fork, AppState } from "./AppState";
import { Lens, Immutable } from "atombeak";
import { Action } from "./actions";

export function philosopher(philospherIndex: number, forkLeftIndex: number, forkRightIndex: number) {
  const forkLeft = fork(forkLeftIndex, philospherIndex)
  const forkRight = fork(forkRightIndex, philospherIndex)
  return pickUpFork(forkLeft)
    .flatMap(() => Immutable.Operation.timeout(4000))
    .flatMap(() => pickUpFork(forkRight))
    .flatMap(() => Immutable.Operation.timeout(4000))
    .flatMap(() => putDownFork(forkLeft))
    .flatMap(() => putDownFork(forkRight))
}

function pickUpFork(f: Lens<AppState, boolean, Action>) {
  return f
    .read()
    .flatMap(taken => {
      if (taken) {
        return Immutable.Operation.retry<AppState, boolean, Action>()
      } else {
        return f.write(true)
      }
    })
}

function putDownFork(f: Lens<AppState, boolean, Action>) {
  return f.write(false)
}