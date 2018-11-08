<template>
  <div id="wrapper">
    <h1>Ohai</h1>
    <div v-if="clientStarted">
      <preference-form></preference-form>
    </div>
    <div v-else>
      Please start your League of Legends client.
    </div>
  </div>
</template>

<script>
  import { store } from './store';
  import PreferenceForm from './PreferenceForm';

  export default {
    name: 'app',
    components: {
      PreferenceForm
    },
    store,
    computed: {
      clientStarted: function () {
        return this.$store.state.lcuState.started;
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