<script>
  import Vue from 'vue';
  import 'element-ui/lib/theme-chalk/index.css';
  import {
    Button,
    Checkbox,
    CheckboxGroup,
    Form,
    FormItem,
    Option,
    RadioButton,
    RadioGroup,
    Select,
    Slider,
  } from 'element-ui';
  import { intensities, positions, roles } from './lol_preferences';
  import { languages } from './languages';
  import lang from 'element-ui/lib/locale/lang/en';
  import locale from 'element-ui/lib/locale';
  import QueueButton from './QueueButton';

  locale.use(lang)

  Vue.use(Button);
  Vue.use(Checkbox);
  Vue.use(CheckboxGroup);
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
        languages,
        positions,
        roles,
      };
    },
    computed: {
      rolesPreference: {
        get() {
          return this.$store.state.preferences.roles;
        },
        set(value) {
          this.$store.commit('preferences/setRoles', value);
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
      primaryPositionPreference: {
        get() {
          return this.$store.state.preferences.primaryPosition;
        },
        set(value) {
          this.$store.commit('preferences/setPrimaryPosition', value);
        },
      },
      secondaryPositionPreference: {
        get() {
          return this.$store.state.preferences.secondaryPosition;
        },
        set(value) {
          this.$store.commit('preferences/setSecondaryPosition', value);
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
    },
  }
</script>

<style lang="scss">
  #preference-form {
    .el-form-item__label {
      color: white;
      font-weight: bold;
      padding-right: 20px;
    }
    .el-checkbox__input:not(.is-checked) + .el-checkbox__label {
      color: white;
    }
  }
</style>

<style lang="scss" scoped>
  h2, p {
    text-align: center;
    color: white;
  }
  h2 {
    font-size: 2em;
  }
  p {
    font-weight: bold;
  }
  .el-checkbox {
    background-color: rgba(0, 0, 0, 0.25);
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

    <el-form-item label="Primary Position">
      <el-radio-group v-model="primaryPositionPreference">
        <el-radio-button
          :label="label"
          :key="label"
          :disabled="label == secondaryPositionPreference"
          v-for="label in positions">
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Secondary Position">
      <el-radio-group v-model="secondaryPositionPreference">
        <el-radio-button
          :label="label"
          :key="label"
          :disabled="label == primaryPositionPreference"
          v-for="label in positions">
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Champion Role (Pick 2)">
      <el-checkbox-group
        v-model="rolesPreference"
        :min="1"
        :max="2">
        <el-checkbox
          v-for="role in roles"
          :label="role"
          :key="role"
          border>
        </el-checkbox>
      </el-checkbox-group>
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