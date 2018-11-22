import * as React from 'react'
import {connect} from 'react-redux'
import { AppState } from './AppState';
import { Dispatch } from 'redux';
import { Action } from './actions';
import { DispatchDispatchable } from './middleware';
import { Immutable } from 'atombeak'
import { philosopher } from './philosopher';
import { NUMBER_OF_PHILOSPHERS } from './const';

type Props = {
  log: string[],
  start: () => void
}

class App extends React.Component<Props> {

  componentDidMount() {
    this.props.start()
  }

  render() {
    return (
      <ul>
        {
          this.props.log.map(logItem => <li>{logItem}</li>)
        }
      </ul>
    )
  }
}

function mapStateToProps(appState: AppState) {
  return {
    log: appState.log
  }
}

function mapDispatchToProps(dispatch: Dispatch<Action> & DispatchDispatchable) {
  return {
    start: () => {
      for (let i = 0; i < NUMBER_OF_PHILOSPHERS; ++i) {
        dispatch(new Immutable.Dispatchable(philosopher(i, i, (i + 1) % NUMBER_OF_PHILOSPHERS)))
      }
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)