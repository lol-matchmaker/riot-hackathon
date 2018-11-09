import Vue from 'vue';
import Vuex from 'vuex';
import { UiControllerState } from '../ui_controller';

Vue.use(Vuex);
Vue.config.devtools = true;

const lcu = {
  namespaced: true,
  state: {
    status: 'lcu-offline',
  },
  mutations: {
    setStatus(state: any, value: UiControllerState): void {
      state.status = value;
    },
  },
};

const preferences = {
  namespaced: true,
  state: {
    archetype: null,
    intensity: null,
    language: null,
    position: null,
  },
  mutations: {
    setArchetype(state: any, value: string): void {
      state.archetype = value;
    },
    setIntensity(state: any, value: number): void {
      state.intensity = value;
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
