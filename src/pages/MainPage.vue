<template>
  <div class="row justify-center text-center">
    <q-card
      v-if="(chatModeSelected === 'admin' && Object.keys(conversationsData).length === 0)"
      color="tertiary" class="q-ma-sm q-pa-sm custom-select-chat-mode"
      inline>
      <q-card-title class="custom-q-card-header">Пока нет активных чатов</q-card-title>
    </q-card>
    <div class="col-xl-4 col-md-6 col-sm-12 col-xs-12"
         v-for="(conversation, key) in conversationsData"
         v-bind:key="key">
      <q-card
        class="q-ma-sm q-pa-sm custom-conversation-q-card"
        v-bind:color="conversation.chatColor"
      >
        <q-card-title v-if="chatModeSelected === 'admin'">
          Id: {{ key }}
          <br/>
          Имя: {{conversation.history[conversation.history.length - 1].userName}}
          <q-card-separator />
        </q-card-title>
        <q-card-title v-if="chatModeSelected === 'user'" >
          <span class="custom-q-card-header">Имя: {{userName}}</span>
          <q-card-separator />
        </q-card-title>
        <q-list class="custom-chatlist">
          <q-chat-message
            v-for="(msg, index) in conversation.history"
            v-bind:key="index"
            :name="msg.userName"
            :avatar="(msg.userName === 'Admin') ? 'admin.png' : 'user.png'"
            :text="[msg.messageText]"
            :class="msg.userName === userName ? 'q-message-sent' : ''"
          />
        </q-list>
        <q-field
          helper="Напишите что нибудь"
          class="q-mb-sm q-pb-sm"
          :error="messageFromChatWindowError"
          :error-label="messageFromChatWindowErrorLabel"
        >
                        <textarea
                          :key="key"
                          class="q-mb-sm q-pb-sm"
                          rows="3"
                          style="width: 100%; border-color: darkgrey"
                          name="messages"
                          v-model="conversation.currentMessage"
                          placeholder="Введите ответ"
                        />
        </q-field>
        <q-btn
          class="custom-button"
          color="secondary"
          v-on:click.prevent="sendChatMessage(conversation)"
          label="Отправить"/>
      </q-card>
    </div>
  </div>
</template>

<script>
import {
  QCard,
  QField,
  QCardTitle,
  QCardSeparator,
  QChatMessage,
}
  from 'quasar';

export default {
  name: 'MainPage',
  components: {
    QCard,
    QField,
    QCardTitle,
    QCardSeparator,
    QChatMessage,
  },
  props: {
    conversationsData: Object,
    chatModeSelected: String,
    userName: String,
  },
  data() {
    return {
      chatHeaderText: '',
      msgText: '',
      messageFromChatWindowError: false,
      messageFromChatWindowErrorLabel: '',
    };
  },
  methods: {
    sendChatMessage(conversation) {
      const msgText = conversation.currentMessage;
      if (msgText.length === 0) {
      // костыль) - без обновления значения текстового поля не обновляет messageFromChatWindowError
        this.msgText = '_';
        this.msgText = '';
        //
        this.messageFromChatWindowError = true;
        this.messageFromChatWindowErrorLabel = 'Вы пытаетесь отправить пустое сообщение';
      } else if (msgText.length > 120) {
        this.messageFromChatWindowError = true;
        this.messageFromChatWindowErrorLabel = 'Максимальная длина сообщения - 120 символов';
      } else if (!/^[a-zA-Zа-яА-Я0-9 ?!.,_:;()-]+$/.test(msgText) && msgText.replace(' ').length > 0) {
        this.messageFromChatWindowError = true;
        this.messageFromChatWindowErrorLabel = 'Сообщение может содержать буквы цифры и знаки препинания';
      } else {
        this.messageFromChatWindowError = false;
        conversation.currentMessage = msgText;
        conversation.sendMessage();
      }
    },
  },
};
</script>

<style scoped>

</style>
