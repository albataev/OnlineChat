<template>
  <q-layout-header>
    <q-toolbar>
      <q-toolbar-title class="text-center">
        Sber-Tech test task.
        <div slot="subtitle">
          Чат работает в режиме {{
            chatModeSelected === 'admin' ? 'администратора' : 'пользователя'
          }}
        </div>
        <div slot="subtitle">Имя пользователя: {{ userName }}
        </div>
      </q-toolbar-title>
    </q-toolbar>
  </q-layout-header>
</template>

<script>
export default {
  props: {
    chatModeSelected: String,
    userName: String,
  },
  name: 'Header1',
};
</script>

<style scoped>

</style>
