<template>
  <div id="wrapper">
    <h1>Ohai</h1>
    <div v-if="lcuStatus == 'offline'">
      Start your League of Legends client.
    </div>
    <div v-else-if="lcuStatus == 'online'">
      Log into the League of Legends client.
    </div>
    <div v-else>
      <preference-form></preference-form>
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
      lcuStatus: function () {
        return this.$store.state.lcu.status;
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