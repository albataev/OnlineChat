<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <Header1
        :chatModeSelected="chatModeSelected"
        :userName='userName'
      />
      <ChatModeSelector
        v-if="chatModeSelected === 'notSelected'"
        :setAdmin="setAdmin"
        v-on:userNameFromChatModeSelector="setUser"/>
      <MainPage
        :chatModeSelected="chatModeSelected"
        :userName=userName
        :key="componentKey"
        :conversationsData="conversations"/>
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar';
import Header1 from '../pages/Header1';
import MainPage from '../pages/MainPage';
import ChatModeSelector from '../pages/ChatModeSelector';

export default {
  name: 'MyLayout',
  components: { ChatModeSelector, MainPage, Header1 },
  data() {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      adminName: 'Admin',
      userName: undefined,
      chatColorPalette: {
        noNewMessages: 'tertiary',
        newMessages: 'teal',
      },
      chatModeSelected: 'notSelected',
      conversations: {},
      componentKey: 1,
      fromChild: '',
      wsIdForUSerSession: '',
      // socket: VueNativeSock.connect('ws://localhost:4000/api'),
    };
  },
  computed: {
  },
  mounted() {
    const wsHost = window.location.origin.replace(/^http/, 'ws');
    // const wsHost = 'ws://localhost:4000/';
    this.socket = new WebSocket(wsHost);
    const keepAliveTimeout = 10000;
    const ping = () => {
      if (this.socket.readyState === this.socket.OPEN) {
        // console.log('Ping');
        this.socket.send(JSON.stringify({
          userName: this.userName || 'ping',
          messageText: 'keepAlive',
        }));
      }
    };
    setInterval(ping, keepAliveTimeout);

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log('Received message: ', message);
      this.componentKey += 1; // force rerender in component
      // if chat in user mode, ws conn id needed for message text parsing
      // this iD get from first server message (tmp solution)
      // check whether 'wsIdForUSerSession' filled to prevent admin wsId rewriting
      if (this.chatModeSelected === 'user' && this.wsIdForUSerSession === '') {
        this.wsIdForUSerSession = message.wsChatKey;
        this.conversations[message.wsChatKey] = {
          currentMessage: '',
          messageFromChatWindowError: false,
          messageFromChatWindowErrorLabel: '',
          history: [],
          chatColor: this.chatColorPalette.noNewMessages,
          sendMessage: () => this.sendMessage(message.wsChatKey),
        };
      }
      // new chat object for the new user
      if (this.chatModeSelected === 'admin'
        && this.conversations[message.wsChatKey] === undefined) {
        this.conversations[message.wsChatKey] = {
          currentMessage: '',
          messageFromChatWindowError: false,
          messageFromChatWindowErrorLabel: '',
          history: [],
          chatColor: this.chatColorPalette.noNewMessages,
          sendMessage: () => this.sendMessage(message.wsChatKey),
        };
      }
      this.conversations[message.wsChatKey].history.unshift(message);
      // highlight unanswered chat card, verify if chat exists for this ws key
      if (this.conversations[message.wsChatKey] !== undefined
        && this.conversations[message.wsChatKey].history[0].userName !== this.userName) {
        this.conversations[message.wsChatKey].chatColor = this.chatColorPalette.newMessages;
      } else {
        this.conversations[message.wsChatKey].chatColor = this.chatColorPalette.noNewMessages;
      }
    };
  },

  methods: {
    openURL,
    setAdmin() {
      this.socket.send(JSON.stringify({
        userName: 'Admin',
        messageText: 'setAdmin',
      }));
      this.chatModeSelected = 'admin';
      this.userName = this.adminName;
      // console.log('adminSet');
    },
    setUser(userNameInput) {
      // console.log('--> setUser. Name: ', this.userName);
      this.userName = userNameInput;
      this.chatModeSelected = 'user';
      // init this.conversations with wsKey, sent back from server.
      this.socket.send(JSON.stringify({
        userName: this.userName,
        messageText: 'Чат запущен',
      }));
    },
    sendMessage(toId = this.wsIdForUSerSession) {
      // #${toId} using on server for admin messages routing
      const message = JSON.stringify({
        userName: this.userName,
        messageText: this.conversations[toId].currentMessage,
        wsChatKey: toId,
      });
      // console.log('--> sending message: ', message);
      this.socket.send(message);
      this.conversations[toId].currentMessage = '';
    },
  },

};
</script>

<style>
</style>
