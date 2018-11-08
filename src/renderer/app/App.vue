<template>
  <div id="wrapper">
    <h1>Ohai</h1>
    <div v-if="clientStarted">
      Good job.
    </div>
    <div v-else>
      Please start your League of Legends client.
    </div>
  </div>
</template>

<script>
  import { LcuState } from './store';

  export default {
    name: 'app',
    store: LcuState,
    computed: {
      clientStarted: function () {
        return this.$store.state.started;
      }
    }
  }
</script>

<style lang="scss">
#wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>