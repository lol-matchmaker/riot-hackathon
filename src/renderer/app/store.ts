import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
Vue.config.devtools = true;

export const lcuState = new Vuex.Store({
  state: {
    started: false,
  },
  mutations: {
    launch(state): void { state.started = true; },
    close(state): void { state.started = false; },
  }
});
