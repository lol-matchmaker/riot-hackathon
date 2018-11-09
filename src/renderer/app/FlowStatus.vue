<script>
  import Vue from 'vue';
  import { Alert } from 'element-ui';

  Vue.use(Alert);

  const attrsByStatus = {
    'lcu-offline': {
      main: 'League of Legends client is offline',
      sub: 'Launch League of Legends.',
      level: 'info',
    },
    'lcu-online': {
      main: 'League of Legends client is online',
      sub: 'Sign into the League of Legends application.',
      level: 'info',
    },
    'connecting': {
      main: 'Oh noes! Can not connect to our server',
      sub: 'Time to debug the server. Woot!',
      level: 'error',
    },
    'challenged': {
      main: 'Blast! Can not drive the LCU',
      sub: 'Time to debug the client. Wee!',
      level: 'error',
    },
    'ready': {
      main: 'Profile loaded and ready to begin!',
      sub: 'Set your matchmaking preferences and queue up!',
      level: 'success',
    },
    'queued': {
      main: 'In queue',
      sub: 'Please wait while find your perfect match',
      level: 'info',
    },
    'matched': {
      main: 'Setting up match',
      sub: 'Please wait while we set up your match',
      level: 'info',
    },
  };

  export default {
    name: 'flow-status',
    computed: {
      attrs() {
        return attrsByStatus[this.$store.state.lcu.status];
      },
    }
  }
</script>

<template>
  <div>
    <el-alert
      v-bind:title="attrs.main"
      v-bind:type="attrs.level"
      v-bind:description="attrs.sub"
      :closable="false"
      show-icon>
    </el-alert>
  </div>
</template>
