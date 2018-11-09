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
    data() {
      return {
        connectedImageUrl: 'https://lolstatic-a.akamaihd.net/frontpage/apps/prod/artbook/en_US/f31d8b829b603b4b65fdff2475bd0803ced0179d/assets/content/champion/16_end/end_01.jpg',
        disconnectedImageUrl: 'https://lolstatic-a.akamaihd.net/frontpage/apps/prod/artbook/en_US/f31d8b829b603b4b65fdff2475bd0803ced0179d/assets/content/champion/00_intro/intro_01.jpg',
        overlayCss: 'linear-gradient(rgba(128, 128, 128, 0.5), rgba(128, 128, 128, 0.9))',
      }
    },
    computed: {
      lcuStatus: function () {
        return this.$store.state.lcu.status;
      },
      backgroundImageUrl: function () {
        switch (this.lcuStatus) {
          case 'lcu-offline':
          case 'connecting':
          case 'challenged':
            return this.disconnectedImageUrl;
          default:
            return this.connectedImageUrl;
        }
      },
    }
  }
</script>

<style lang="scss">
body {
  height: 100vh;
  margin: 0;

  > .el-container {
    height: 100%;
  }
}

</style>

<template>
  <el-container :style="{ background: overlayCss + ', url(' + backgroundImageUrl + ') center/cover' }">
    <el-header>
      <h1>Ohai</h1>
    </el-header>
    <el-main>
      <div v-if="lcuStatus == 'ready'">
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


