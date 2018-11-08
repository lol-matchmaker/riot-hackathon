import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
Vue.config.devtools = true;

const lcuState = {
  namespaced: true,
  state: {
    started: false
  },
  mutations: {
    launch(state: any): void {
      state.started = true;
    },
    close(state: any): void {
      state.started = false;
    },
  },
};

const preferences = {
  namespaced: true,
  state: {
    archetype: null,
    language: null,
  },
  mutations: {
    setArchetype(state: any, value: string): void {
      state.archetype = value;
    },
    setLanguage(state: any, value: string): void {
      state.language = value;
    },
  },
};

export const store = new Vuex.Store({
  modules: {
    lcuState,
    preferences,
  },
});
