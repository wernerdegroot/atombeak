import { fork, StoreState } from './StoreState'
import { Action } from './actions'
import { Operation, TVar } from 'atombeak'
import { THINK_TIME, EAT_TIME } from './const'

// A philospher will try to pick up the forks assigned to them.
// He/she will first try to grab the fork on the left. He/she will
// then wait for 4 seconds before attempting to grab the fork on
// the right. After another 4 seconds, the philosopher will put
// down both forks.
export function philosopher(philospherIndex: number, forkLeftIndex: number, forkRightIndex: number) {
  // Get two `TVar`'s: one for the left fork, one for the right fork.
  const forkLeft = fork(forkLeftIndex, philospherIndex)
  const forkRight = fork(forkRightIndex, philospherIndex)

  // Run through the steps described above.
  return pickUpFork(forkLeft)
    .flatMap(() => Operation.timeout(THINK_TIME))
    .flatMap(() => pickUpFork(forkRight))
    .flatMap(() => Operation.timeout(EAT_TIME))
    .flatMap(() => putDownFork(forkLeft))
    .flatMap(() => putDownFork(forkRight))
}

// Picking up a fork starts by checking the value of the fork.
// The value `true` indicates that the fork is already taken
// by another philosopher, so we should retry and wait for the
// fork to become available. If the fork is free, we assign the
// value `true` to it, to indicate that we just picked it up.
function pickUpFork(f: TVar<StoreState, boolean, Action>) {
  return f.read().flatMap(taken => {
    if (taken) {
      return Operation.retry<StoreState, boolean, Action>()
    } else {
      return f.write(true)
    }
  })
}

// Putting down a fork is nothing more than assigning the value `false`
// to that fork, indicating that it is available again.
function putDownFork(f: TVar<StoreState, boolean, Action>) {
  return f.write(false)
}
