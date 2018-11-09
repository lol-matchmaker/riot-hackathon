<script>
  import Vue from 'vue';
  import 'element-ui/lib/theme-chalk/index.css';
  import { Button, Form, FormItem, RadioGroup, RadioButton, Select, Option } from 'element-ui';
  import { archetypes, positions } from './lol_preferences';
  import { languages } from './languages';
  import lang from 'element-ui/lib/locale/lang/en';
  import locale from 'element-ui/lib/locale';

  locale.use(lang)

  Vue.use(Button);
  Vue.use(Form);
  Vue.use(FormItem);
  Vue.use(RadioGroup);
  Vue.use(RadioButton);
  Vue.use(Select);
  Vue.use(Option);

  export default {
    name: 'preference-form',
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
      sortByEnglishName: function (languages) {
        return languages.slice().sort((a, b) => a['englishName'].localeCompare(b['englishName']));
      },
    }
  }
</script>

<style lang="scss" scoped>
h2, p {
  text-align: center;
}
.el-select {
  width: 300px;
}
li {
  display: flex;
  justify-content: space-between;

  .en {
    font-weight: bold;
  }
}
</style>

<template>
  <el-form label-width="150px">
    <h2>My Preferences</h2>
    <p>Customize your next practice session.</p>

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
      <el-button type="primary">Find Team</el-button>
    </el-form-item>
  </el-form>
</template>