import { Lens } from 'atombeak'
import { pickUpFork, putDownFork, Action } from './actions';

export type AppState = Readonly<{
  forks: boolean[],
  log: string[]
}>

export function fork(forkIndex: number, philosopherIndex: number): Lens<AppState, boolean, Action> {
  return new Lens(
    appState => appState.forks[forkIndex],
    'fork-' + forkIndex,
    value => {
      return value
        ? pickUpFork(forkIndex, philosopherIndex)
        : putDownFork(forkIndex, philosopherIndex)
    })
}