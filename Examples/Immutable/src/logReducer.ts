import { Action, PICK_UP_FORK, PUT_DOWN_FORK } from "./actions";

export function logReducer(log: string[] = [], action: Action): string[] {
  switch (action.type) {
    case PICK_UP_FORK:
      return [...log, `Philosopher ${action.philospherIndex} picked up fork ${action.forkIndex}`]
    case PUT_DOWN_FORK:
      return [...log, `Philosopher ${action.philospherIndex} put down fork ${action.forkIndex}`]
    default:
      return log
  }
}