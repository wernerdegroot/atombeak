import { Message, resultReceivedMessage, nextIteration } from "./Message";
import { State, Pending, Done } from "./Retryer";
import { Command, NO_OP, RESOLVE, SHOULD_EXECUTE, shouldExecute } from "./Command";
import { Operation } from "../Operation";
import { Log } from "../Log";
import { ITER, Trampoline, DONE, run } from "../Trampoline";

export class Queue<Outer, Inner, Action> {
  private messages: Array<Message<Outer, Inner, Action>> = []
  private isExecuting = false
  public isDone = false
  private state: State<Outer, Inner, Action>

  constructor(private readonly operation: Operation<Outer, Inner, Action>, private readonly getOuter: () => Outer, private readonly dispatch: (action: Action) => void) {
    const outer = getOuter()
    this.state = new Pending([], new Log([]), outer)
    this.executeCommand(shouldExecute(outer))
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
    } else if (command.type === SHOULD_EXECUTE) {
      run(
        this.operation,
        command.outer,
        log => {
          this.push(nextIteration(log))
        },
        result => {
          const outer = this.getOuter()
          this.push(resultReceivedMessage(result, outer))
        })
    }
  }
}