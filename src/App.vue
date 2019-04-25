/* eslint-disable */

<template>
  <div id="q-app">
    <MyLayout />
  </div>
</template>

<script>
// const HOST = location.origin.replace(/^http/, 'ws');

import MyLayout from './layouts/MyLayout';

export default {
  name: 'App',
  components: { MyLayout },
};
</script>

<style>
</style>
