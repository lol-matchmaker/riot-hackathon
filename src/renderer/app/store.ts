import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
Vue.config.devtools = true;

type LcuStatusType = 'offline' | 'online' | 'signedin';
const lcu = {
  namespaced: true,
  state: {
    status: 'offline',
  },
  mutations: {
    setStatus(state: any, value: LcuStatusType): void {
      state.status = value;
    },
  },
};

const preferences = {
  namespaced: true,
  state: {
    archetype: null,
    language: null,
    position: null,
  },
  mutations: {
    setArchetype(state: any, value: string): void {
      state.archetype = value;
    },
    setLanguage(state: any, value: string): void {
      state.language = value;
    },
    setPosition(state: any, value: string): void {
      state.position = value;
    },
  },
};

export const store = new Vuex.Store({
  modules: {
    lcu,
    preferences,
  },
});
