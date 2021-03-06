import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import HomeView from './views/Home';
import {Provider} from 'mobx-react';
import stores from './stores';

class Root extends React.Component {
  render() {
    return (
      <Provider {...stores}>
        <Router>
          <Switch>
            <Route path="/" component={HomeView} />
          </Switch>
        </Router>
      </Provider>
    );
  }
}

export default Root;