<script>
  import Vue from 'vue';
  import { Button } from 'element-ui';

  Vue.use(Button);

  export default {
    name: 'queue-button',
    methods: {
      enterQueue() {
        window.controller.enterQueue();
      },
    },
  }
</script>

<template>
  <el-button type="primary" v-on:click.once="enterQueue">Find Team</el-button>
</template>