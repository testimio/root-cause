import { configure } from 'mobx';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

configure({
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
