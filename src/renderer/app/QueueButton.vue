<script>
  import Vue from 'vue';
  import { Button } from 'element-ui';

  Vue.use(Button);

  const unqueuedAttrs = {
    icon: 'search',
    label: 'Find Team',
    type: 'primary',
  };
  const queuedAttrs = {
    icon: 'loading',
    label: 'Cancel Search',
    type: 'danger',
  };

  export default {
    name: 'queue-button',
    computed: {
      queued() {
        const lcuStatus = this.$store.state.lcu.status;
        return lcuStatus == 'queued';
      },
      attrs() {
        return this.queued ? queuedAttrs : unqueuedAttrs;
      },
    },
    methods: {
      enqueueOrDequeue() {
        if (this.queued) {
          window.controller.exitQueue();
        } else {
          window.controller.enterQueue();
        }
      },
    },
  }
</script>

<template>
  <el-button
    :type="attrs.type"
    :icon="'el-icon-' + attrs.icon"
    v-on:click="enqueueOrDequeue"
  >{{attrs.label}}</el-button>
</template>