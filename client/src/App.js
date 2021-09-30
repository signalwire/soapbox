import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
  useParams,
} from "react-router-dom";

import { useSelector, useDispatch } from 'react-redux'
import { store, setName } from './store'

const PrivateRoute = ({ children, name, ...rest }) => {
  // select name from the store
  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (name) {
          return children;
        }

        console.log('location', location);

        return (
          <Redirect to={{ pathname: '/login', state: { from: location } }} />
        );
      }}
    />
  );
};

const LoginRoute = ({ children, name, ...rest }) => {
  // select name from the store
  const location = useLocation();
  console.log('LoginRoute', location.state.from);

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!name) {
          return children;
        }
        return (
          <Redirect
            to={{
              pathname: location.state.from.pathname,
              state: { from: location },
            }}
          />
        );
      }}
    />
  );
};

function Home() {
  return <h2>Home</h2>;
}

function Room() {
  const { roomName } = useParams();

  console.log('Joining room', roomName);

  return (
    <div>
      <h2>Room Detail</h2>
      <div id="rootSDK"></div>
    </div>
  );
}

function Login({ setName }) {
  const [inputValue, setInputValue] = useState('');
  const onSubmit = (event) => {
    event.preventDefault();
    setName(inputValue);
  };
  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
        />
        <input type="submit" value="Join" />
      </form>
    </div>
  );
}

export default function App() {
  const [name, setName] = useState('');

  const count = useSelector((state) => state.name.value)
  const dispatch = useDispatch()

  useEffect(() => {
    if (name) {
      console.log('Name changed');
    }
  }, [name]);

  return (
    <Router>
      <div>
        <Switch>
          <LoginRoute path="/login" name={name}>
            <Login setName={setName} />
          </LoginRoute>
          <PrivateRoute path="/room/:roomName" name={name}>
            <Room />
          </PrivateRoute>
          <PrivateRoute path="/" name={name} bla="ciao">
            <Home />
          </PrivateRoute>
        </Switch>
      </div>
    </Router>
  );
}