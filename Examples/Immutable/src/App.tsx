import * as React from 'react'
import { connect } from 'react-redux'
import { StoreState } from './StoreState'
import { Dispatch } from 'redux'
import { Action } from './actions'
import { philosopher } from './philosopher'
import { NUMBER_OF_PHILOSPHERS } from './const'
import { DispatchOperation } from 'atombeak'

type Props = {
  log: string[]
  start: () => void
}

/**
 * Component that just renders the log as a list.
 * This way, the user of our toy application can
 * see what happened, and when.
 */
class App extends React.Component<Props> {
  // When the toy application initializes,
  // start the dinner. Each philosopher will
  // try to pick up its two forks.
  componentDidMount() {
    this.props.start()
  }

  // Render the log to the screen.
  render() {
    return (
      <ul>
        {this.props.log.map(logItem => (
          <li>{logItem}</li>
        ))}
      </ul>
    )
  }
}

function mapStateToProps(storeState: StoreState) {
  return {
    log: storeState.log
  }
}

function mapDispatchToProps(dispatch: Dispatch<Action> & DispatchOperation<StoreState>) {
  return {
    // Start the dinner. Loop over each philospher, give them
    // two forks to pick up and start the operation.
    start: () => {
      for (let i = 0; i < NUMBER_OF_PHILOSPHERS; ++i) {
        // Determine which forks to pick up. For instance,
        // philosopher 0 will pick up fork 0 and fork 1.
        // Philosopher 3 will pick up fork 3 and fork 0.
        const forkLeftIndex = i
        const forkRightIndex = (i + 1) % NUMBER_OF_PHILOSPHERS
        dispatch(philosopher(i, forkLeftIndex, forkRightIndex))
      }
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
