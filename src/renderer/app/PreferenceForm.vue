<script>
  import Vue from 'vue';
  import 'element-ui/lib/theme-chalk/index.css';
  import {
    Button,
    Form,
    FormItem,
    Option,
    RadioButton,
    RadioGroup,
    Select,
    Slider,
  } from 'element-ui';
  import { archetypes, intensities, positions } from './lol_preferences';
  import { languages } from './languages';
  import lang from 'element-ui/lib/locale/lang/en';
  import locale from 'element-ui/lib/locale';
  import QueueButton from './QueueButton';

  locale.use(lang)

  Vue.use(Button);
  Vue.use(Form);
  Vue.use(FormItem);
  Vue.use(Option);
  Vue.use(RadioButton);
  Vue.use(RadioGroup);
  Vue.use(Select);
  Vue.use(Slider);

  export default {
    name: 'preference-form',
    components: {
      QueueButton
    },
    data () {
      return {
        archetypes,
        languages,
        positions,
      };
    },
    computed: {
      archetypePreference: {
        get() {
          return this.$store.state.preferences.archetype;
        },
        set(value) {
          this.$store.commit('preferences/setArchetype', value);
        },
      },
      intensityPreference: {
        get() {
          return this.$store.state.preferences.intensity;
        },
        set(value) {
          this.$store.commit('preferences/setIntensity', value);
        }
      },
      languagePreference: {
        get() {
          return this.$store.state.preferences.language;
        },
        set(value) {
          this.$store.commit('preferences/setLanguage', value);
        },
      },
      positionPreference: {
        get() {
          return this.$store.state.preferences.position;
        },
        set(value) {
          this.$store.commit('preferences/setPosition', value);
        },
      },
    },
    methods: {
      intensityLabel: function (intensity) {
        return intensities[intensity / 25];
      },
      sortByEnglishName: function (languages) {
        return languages.slice().sort((a, b) => a['englishName'].localeCompare(b['englishName']));
      },
    }
  }
</script>

<style lang="scss">
  #preference-form {
    .el-form-item {
      &__label {
        color: black;
      }
    }
  }
</style>

<style lang="scss" scoped>
  h2, p {
    text-align: center;
  }
  .el-slider {
    width: 500px;
  }
  .el-select {
    width: 300px;
  }
  .el-select-dropdown__item {
    display: flex;
    justify-content: space-between;

    .en {
      font-weight: bold;
    }
  }
</style>

<template>
  <el-form label-width="150px" id="preference-form">
    <h2>My Preferences</h2>
    <p>Customize your next practice session.</p>

    <el-form-item label="Intensity">
      <el-slider
        v-model="intensityPreference"
        :step="25"
        :format-tooltip="intensityLabel"
        show-stops>
      </el-slider>
    </el-form-item>

    <el-form-item label="Position">
      <el-radio-group v-model="positionPreference">
        <el-radio-button :label="label" :key="label" v-for="label in positions">
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Champion Archetype">
      <el-radio-group v-model="archetypePreference">
        <el-radio-button :label="label" :key="label" v-for="label in archetypes">
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Chat Language">
      <el-select v-model="languagePreference" placeholder="Select language" filterable>
        <el-option
          v-for="language in sortByEnglishName(languages)"
          :key="language['locale']"
          :label="language['englishName']"
          :value="language['locale']">
          <span class="en">{{ language['englishName'] }}</span>
          <span class="native">{{ language['nativeName'] }}</span>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" plain>Save</el-button>
      <queue-button></queue-button>
    </el-form-item>
  </el-form>
</template>