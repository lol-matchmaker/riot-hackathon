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
      console.log('LCU STATE:', value);
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
    lcu,
    preferences,
  },
});
