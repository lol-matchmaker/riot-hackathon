<template>
<div>
  <el-alert
    v-bind:title="attrs.main"
    v-bind:type="attrs.level"
    v-bind:description="attrs.sub"
    :closable="false"
    show-icon>
  </el-alert>
  <div>{{test}}</div>
</div>
</template>

<script>
  import Vue from 'vue';
  import { Alert } from 'element-ui';

  Vue.use(Alert);

  const attrsByStatus = {
    'lcu-offline': {
      main: 'League of Legends client is offline',
      sub: 'Launch League of Legends',
      level: 'info',
    },
    'lcu-online': {
      main: 'League of Legends client is online',
      sub: 'Sign into the League of Legends application',
      level: 'info',
    },
    'connecting': {
      main: 'Signed into the League of Legends application',
      sub: 'Fetching your preferences profile....',
      level: 'success',
    },
    'challenged': {
      main: 'Signed into the League of Legends application',
      sub: 'Fetching your preferences profile....',
      level: 'success',
    },
    'ready': {
      main: 'Signed into the League of Legends application',
      sub: 'Fetching your preferences profile....',
      level: 'success',
    },
  };

  export default {
    name: 'flow-status',
    computed: {
      test() {
        console.log('test', attrsByStatus[this.$store.state.lcu.status].main);
        return this.$store.lcu;
      },
      attrs() {
        return attrsByStatus[this.$store.state.lcu.status];
      },
    }
  }
</script>
