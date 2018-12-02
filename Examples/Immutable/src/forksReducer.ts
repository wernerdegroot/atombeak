import { Action, PICK_UP_FORK, PUT_DOWN_FORK } from './actions'
import { NUMBER_OF_PHILOSPHERS } from './const'

// Assigns a value `true` (fork is taken by a philosopher) or
// `false` (fork is free) to the given `forkIndex`.
function setFork(forks: boolean[], forkIndex: number, value: boolean): boolean[] {
  return forks.map((fork, i) => (i === forkIndex ? value : fork))
}

// Each fork is initially free.
const defaultForks: boolean[] = []
for (let i = 0; i < NUMBER_OF_PHILOSPHERS; ++i) {
  defaultForks.push(false)
}

export function forksReducer(forks: boolean[] = defaultForks, action: Action): boolean[] {
  switch (action.type) {
    case PICK_UP_FORK:
      return setFork(forks, action.forkIndex, true)
    case PUT_DOWN_FORK:
      return setFork(forks, action.forkIndex, false)
    default:
      return forks
  }
}
