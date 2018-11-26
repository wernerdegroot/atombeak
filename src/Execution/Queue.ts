import { Message, resultReceivedMessage, nextIteration, NEXT_ITERATION, RESULT_RECEIVED } from "./Message";
import { State, Pending, Done } from "./Retryer";
import { Command, NO_OP, RESOLVE, SHOULD_RESTART, shouldRestart, SHOULD_CONTINUE } from "./Command";
import { Operation } from "../Operation/Operation";
import { Log } from "../Log";
import { ITER, Trampoline, DONE, run } from "../Trampoline";

export class Queue<Outer, Inner, Action> {
  private messages: Array<Message<Outer, Inner, Action>> = []
  private isExecuting = false
  public isDone = false
  private state: State<Outer, Inner, Action>
  private operation: Operation<Outer, Inner, Action>

  constructor(
    private originalOperation: Operation<Outer, Inner, Action>,
    private readonly getOuter: () => Outer,
    private readonly dispatch: (action: Action) => void) {
    this.operation = originalOperation
    const attempt = 0
    const log = Log.create<Outer, Action>(getOuter())
    this.state = new Pending(attempt, log, [])
    this.executeCommand(shouldRestart(attempt, log))
  }

  push(message: Message<Outer, Inner, Action>) {
    if (this.isDone) {
      return
    }

    this.messages = [...this.messages, message]
    if (!this.isExecuting) {
      this.isExecuting = true
      while (this.messages.length > 0) {
        const [head, ...tail] = this.messages
        this.messages = tail
        const [nextState, command] = this.state.next(head)
        console.log(this.state, head, nextState, command)
        this.state = nextState
        this.executeCommand(command)
      }
      if (this.state instanceof Done) {
        this.state.getActions().forEach(action => {
          this.dispatch(action)
        })
        this.isDone = true
      }
      this.isExecuting = false
    }
  }

  executeCommand(command: Command<Outer, Inner, Action>) {
    if (command.type === NO_OP) {
      return
    } else if (command.type === RESOLVE) {
      // What?
    } else if (command.type === SHOULD_RESTART) {
      this.operation = this.originalOperation
      const trampoline = this.operation.execute(command.log)
      if (trampoline.type === ITER) {
        trampoline.next().then(([operation, log]) => {
          this.operation = operation
          this.push(nextIteration(command.attempt, log))
          // Problem with this: log is old when the promise in the trampoline
          // is resolved. Many states may have passed in the meantime.
        })
      } else if (trampoline.type === DONE) {
        this.push(resultReceivedMessage(command.attempt, trampoline.value, this.getOuter()))
      } else {
        const exhaustive: never = trampoline
        throw new Error(exhaustive)
      }
    } else if (command.type === SHOULD_CONTINUE) {
      const trampoline = this.operation.execute(command.log)
      if (trampoline.type === ITER) {
        trampoline.next().then(([operation, log]) => {
          this.operation = operation
          this.push(nextIteration(command.attempt, log))
        })
      } else if (trampoline.type === DONE) {
        this.push(resultReceivedMessage(command.attempt, trampoline.value, this.getOuter()))
      } else {
        const exhaustive: never = trampoline
        throw new Error(exhaustive)
      }
    } else {
      const exhaustive: never = command
      throw new Error(exhaustive)
    }
  }
}