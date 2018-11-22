import * as React from "react";
import * as ReactDOM from "react-dom";
import App from './App'
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { reducer } from "./reducer";
import { middleware } from "./middleware";

ReactDOM.render(
    <Provider store={createStore(reducer, applyMiddleware(middleware))}>
      <App />
    </Provider>,
    document.getElementById("example")
);