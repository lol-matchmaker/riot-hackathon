// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import Vue from 'vue';

import App from './app/App.vue';
import { store } from './app/store';

import { UiController } from './ui_controller';

// tslint:disable-next-line:no-unused-expression
new Vue({
  el: '#app',
  render: h => h(App),
});

// tslint:disable-next-line:no-unused-expression
(self as any).controller = new UiController(store);
