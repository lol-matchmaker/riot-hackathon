<template>
  <el-container>
    <el-header>
      <h1>Ohai</h1>
    </el-header>
    <el-main>
      <div v-if="lcuStatus == 'signedin'">
        <preference-form></preference-form>
      </div>
      <div v-else>
      </div>
    </el-main>
    <el-footer>
      <flow-status></flow-status>
    </el-footer>
  </el-container>
</template>

<script>
  import Vue from 'vue';
  import { Container, Header, Main, Footer } from 'element-ui';
  import { store } from './store';
  import FlowStatus from './FlowStatus';
  import PreferenceForm from './PreferenceForm';

  Vue.use(Container);
  Vue.use(Header);
  Vue.use(Main);
  Vue.use(Footer);

  export default {
    name: 'app',
    components: {
      FlowStatus,
      PreferenceForm,
    },
    store,
    computed: {
      lcuStatus: function () {
        return this.$store.state.lcu.status;
      }
    }
  }
</script>