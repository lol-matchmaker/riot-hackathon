<template>
  <el-form>
    <h2>My Preferences</h2>
    <el-form-item label="Champion Archetype">
      <el-radio-group v-model="archetypePreference">
        <el-radio-button :label="label" :key="label" v-for="label in archetypes"></el-radio-button>
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
  </el-form>
</template>

<script>
  import Vue from 'vue';
  import 'element-ui/lib/theme-chalk/index.css';
  import { Form, FormItem, RadioGroup, RadioButton, Select, Option } from 'element-ui';
  import { archetypes } from './archetypes';
  import { languages } from './languages';
  import lang from 'element-ui/lib/locale/lang/en';
  import locale from 'element-ui/lib/locale';

  locale.use(lang)

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
    },
    methods: {
      sortByEnglishName: function (languages) {
        return languages.sort((a, b) => a['englishName'].localeCompare(b['englishName']));
      },
    }
  }
</script>

<style lang="scss">
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