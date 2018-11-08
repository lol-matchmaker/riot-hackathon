import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
Vue.config.devtools = true;

export const LcuState = new Vuex.Store({
  state: {
    started: false
  },
  mutations: {
    launch (state) { state.started = true; },
    close (state) { state.started = false; }
  }
});