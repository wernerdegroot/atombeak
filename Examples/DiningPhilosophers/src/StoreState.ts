import { pickUpFork, putDownFork, Action } from './actions'
import { TVar } from 'atombeak'

export type StoreState = Readonly<{
  // The forks are modelled as a number of `boolean`'s. One for
  // each fork. When a fork has the value `true`, that means that
  // it is currently taken by a philospher. No other philosopher
  // should/can pick up that fork at that time. When the value is
  // `false`, the fork is free to be picked up by any philosopher
  // that wants to.
  forks: boolean[]

  // The log is a record of all the things that happened during the
  // dinner.
  log: string[]
}>

// Get a `TVar` for a given fork (specified by `forkIndex`).
export function fork(forkIndex: number, philosopherIndex: number): TVar<StoreState, boolean, Action> {
  return new TVar(
    // Grab the value for the fork specified by `forkIndex`:
    appState => appState.forks[forkIndex],

    // Think of an unique identifier for this fork:
    'fork-' + forkIndex,

    // We write a value to a fork by dispatching an action:
    value => {
      return value ? pickUpFork(forkIndex, philosopherIndex) : putDownFork(forkIndex, philosopherIndex)
    }
  )
}
