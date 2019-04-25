<template>
  <div class="row justify-center text-center">
    <div class="col-xl-4 col-md-6 col-sm-12 col-xs-12">
      <q-card color="tertiary" class="q-ma-sm q-pa-sm custom-select-chat-mode" inline>
        <q-card-title>Тестовый чат. Войти как пользователь</q-card-title>
        <q-card-separator />
        <q-field
          helper="Представьтесь, пожалуйста"
          class="q-mb-sm q-pb-sm"
          :error="userNameError"
          :error-label="userNameErrorLabel"
        >
          <q-input
            dark color="dark"
            class="q-mb-sm q-pb-sm"
            style="width: 100%; border-color: darkgrey;"
            name="userNameInput"
            v-model="userNameInput"
          >
          </q-input>
        </q-field>
        <q-card-separator />
        <q-btn
          class="custom-button"
          color="secondary"
          v-on:click.prevent="emitUserNameToParent"
          type="submit"
          label="Продолжить" />
      </q-card>
    </div>
    <div class="col-xl-4 col-md-6 col-sm-12 col-xs-12">
      <q-card color="tertiary" class="q-ma-sm q-pa-sm custom-select-chat-mode" inline>
        <q-card-title> Тестовый чат. Войти как администратор
        </q-card-title>
        <q-card-separator />
        <q-btn
          class="custom-button-admin"
          color="secondary"
          v-on:click.prevent="setAdmin"
          label="Продолжить" />
      </q-card>
    </div>
  </div>
</template>

<script>
import {
  QInput,
  QCard,
  QField,
  QCardTitle,
  QCardSeparator,
}
  from 'quasar';

export default {
  name: 'ChatModeSelector',
  components: {
    QInput,
    QCard,
    QField,
    QCardTitle,
    QCardSeparator,
  },
  props: {
    setAdmin: Function,
  },
  data() {
    return {
      userNameInput: '',
      userNameError: false,
      userNameErrorLabel: '',
    };
  },
  methods: {
    // Define the method that emits data to the parent as the first parameter to `$emit()`.
    // This is referenced in the <template> call in the parent. The second parameter is the payload.
    emitUserNameToParent() {
      if (this.userNameInput.length < 4 || this.userNameInput.length > 12) {
        this.userNameError = true;
        this.userNameErrorLabel = 'Имя должно быть больше 4 и меньше 12 символов';
      } else if (!/^[a-zA-Zа-яА-Я]+$/.test(this.userNameInput)) {
        this.userNameError = true;
        this.userNameErrorLabel = 'Имя может содержать только буквы';
      } else {
        this.userNameError = false;
        this.$emit('userNameFromChatModeSelector', this.userNameInput);
      }
    },
  },
};
</script>

<style scoped>

</style>
