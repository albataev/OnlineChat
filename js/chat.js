// создать подключение

if (!window.WebSocket) {
    document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}
var HOST = location.origin.replace(/^http/, 'ws');
// todo: implement separate message threads between multiple admin sessions
Vue.config.devtools = true;

Vue.component('chat-app-header', {
    props: {
        usersOnline: String,
        chatModeSelected: String,
        userName: String
    },
    template: `
        <q-layout-header>
            <q-toolbar>
                <q-toolbar-title class="text-center">
                    Sber-Tech test task.
                     <div slot="subtitle">
                     Чат работает в режиме {{ chatModeSelected === 'admin' ? 'администратора' : 'пользователя' }}
                     </div>
                     <div slot="subtitle">Имя пользователя: {{ userName }}
                     </div>
                </q-toolbar-title>
            </q-toolbar>
        </q-layout-header>
    `
});

Vue.component('chat-mode-selector', {
    props: {
        setAdmin: Function
    },
    template: `
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
    `,
    data() {
        return {
            userNameInput: '',
            userNameError: false,
            userNameErrorLabel: ''
        }
    },
    methods: {
        // Define the method that emits data to the parent as the first parameter to `$emit()`.
        // This is referenced in the <template> call in the parent. The second parameter is the payload.
        emitUserNameToParent (event) {
            if (this.userNameInput.length < 4 || this.userNameInput.length > 12) {
                this.userNameError = true;
                this.userNameErrorLabel = 'Имя должно быть больше 4 и меньше 12 символов'
            } else if (!/^[a-zA-Zа-яА-Я]+$/.test(this.userNameInput)) {
                this.userNameError = true;
                this.userNameErrorLabel = 'Имя может содержать только буквы'
            } else {
                this.userNameError = false;
                this.$emit('userNameFromChatModeSelector', this.userNameInput)
            }
        }
    },
});

Vue.component('main-page-data', {
    props: {
        conversationsData: Object,
        chatModeSelected: String,
        userName: String
    },
    template: `
        <div class="row justify-center text-center">
            <q-card 
                v-if="(chatModeSelected === 'admin' && Object.keys(conversationsData).length === 0)"
                color="tertiary" class="q-ma-sm q-pa-sm custom-select-chat-mode"
                inline>
                <q-card-title class="custom-q-card-header">Пока нет активных чатов</q-card-title>
            </q-card>       
            <div class="col-xl-4 col-md-6 col-sm-12 col-xs-12" v-for="(conversation, key) in conversationsData" >
                <q-card
                    class="q-ma-sm q-pa-sm custom-conversation-q-card"
                    v-bind:color="conversation.chatColor"          
                    >
                    <q-card-title v-if="chatModeSelected === 'admin'"> 
                    Id: {{ key }}</br>
                    Имя: {{conversation.history[conversation.history.length - 1].split('&')[0]}}
                    <q-card-separator />
                    </q-card-title>
                    <q-card-title v-if="chatModeSelected === 'user'" > 
                        <span class="custom-q-card-header">Имя: {{userName}}</span>
                        <q-card-separator />
                    </q-card-title>
                    <q-list class="custom-chatlist">
                        <q-chat-message
                            v-for="msg in conversation.history"
                            :name="msg.split('&')[0]"
                            :avatar="(msg.split('&')[0] === 'Admin') ? 'admin.png' : 'user.png'"
                            :text="[msg.split('&')[1]]"
                            :class="msg.split('&')[0] === userName ? 'q-message-sent' : ''"
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
    `,
    data() {
        return {
            chatHeaderText: '',
            msgText: '',
            messageFromChatWindowError: false,
            messageFromChatWindowErrorLabel: ''
        }
    },
    methods: {
        sendChatMessage (conversation) {
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
                this.messageFromChatWindowErrorLabel = 'Максимальная длина сообщения - 120 символов'
            } else if (!/^[a-zA-Zа-яА-Я0-9 ]+$/.test(msgText) && msgText.replace(' ').length > 0) {
                this.messageFromChatWindowError = true;
                this.messageFromChatWindowErrorLabel = 'Сообщение может содержать только буквы и цифры'
            } else {
                this.messageFromChatWindowError = false;
                conversation.currentMessage = msgText;
                conversation.sendMessage();
            }
        },
    }
});

var app = new Vue({

    template: `
        <q-layout view="lHh lPr fFf">
    
            <chat-app-header 
                :chatModeSelected="chatModeSelected" 
                :userName="userName"
            />
        
            <q-page-container>
          
          <chat-mode-selector
              v-if="chatModeSelected === 'notSelected'"
              :setAdmin="setAdmin"
              v-on:userNameFromChatModeSelector="setUser"      
          ></chat-mode-selector>
          
          <main-page-data
              :chatModeSelected="chatModeSelected"
              :userName="userName"
              :key="componentKey"
              :conversationsData="conversations"        
          /> 
          
          </q-page-container>
        </q-layout>
     `,

    el: '#root',

    data: {
        adminName: 'Admin',
        userName: '',
        chatColorPalette: {
            'noNewMessages': 'tertiary',
            'newMessages': 'teal'
        },
        chatModeSelected: 'notSelected',
        conversations: {},
        componentKey: 1,
        fromChild: '',
        wsIdForUSerSession: ''
    },

    created: () => {
        this.socket = new WebSocket(HOST);
        const keepAliveTimeout = 10000;
        const ping = () => {
            console.log('Ping');
            this.socket.readyState === this.socket.OPEN ?
                this.socket.send('keepAlive') : null
        };
        setInterval(ping, keepAliveTimeout);

        this.socket.onmessage = (event) => {
            let [messageText, wsKey] = event.data.split('#');
            app.componentKey += 1; // force rerender in component
            // if chat in user mode, ws conn id needed for message text parsing
            // this iD get from first server message (tmp solution)
            // check whether 'wsIdForUSerSession' filled to prevent admin wsId rewriting
            if (app.chatModeSelected === 'user' && app.wsIdForUSerSession === '') {
                app.wsIdForUSerSession = wsKey
            }
            // new chat object for the new user
            if (app.conversations[wsKey] === undefined) {
                app.conversations[wsKey] = {
                    currentMessage: '',
                    messageFromChatWindowError: false,
                    messageFromChatWindowErrorLabel: '',
                    history: [],
                    chatColor: app.chatColorPalette.noNewMessages,
                    sendMessage: () => app.sendMessage(wsKey)
                }
            }
            app.conversations[wsKey].history.unshift(`${messageText}`);
            // highlight unanswered chat card, verify if chat exists for this ws key
            if (app.conversations[wsKey] !== undefined &&
                app.conversations[wsKey].history[0].split('&')[0] !== app.userName) {
                app.conversations[wsKey].chatColor = app.chatColorPalette.newMessages
            } else {
                app.conversations[wsKey].chatColor = app.chatColorPalette.noNewMessages;
            }
        };
    },

    methods: {
        setAdmin: () => {
            this.socket.send('setAdmin');
            app.chatModeSelected = 'admin';
            app.userName = app.adminName;
            console.log('adminSet');
        },
        setUser: (userNameInput) => {
            app.userName = userNameInput;
            app.chatModeSelected = 'user';
            console.log('--> setUser. Name: ', app.userName);
            // init app.conversations with wsKey, sent back from server.
            this.socket.send(`${app.userName}& -- Чат запущен --`);

        },
        sendMessage: (toId = app.wsIdForUSerSession) => {
            // #${toId} using on server for admin messages routing
            console.log('--> sending message: \n', `${app.userName}&${app.conversations[toId].currentMessage}#${toId}`);
            this.socket.send(`${app.userName}&${app.conversations[toId].currentMessage}#${toId}`);
            app.conversations[toId].currentMessage = '';
        }
    }
});
