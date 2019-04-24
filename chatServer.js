const path = require('path');
const express = require('express');
const app = express();
var expressWs = require('express-ws')(app);
let httpServerPort = 8080;
const portNumberCommandLineInput = process.argv.slice(2)[0];
// служебные сообщения, которые не надо маршрутизировать
const systemCommands = [
    'setAdmin',
    'removeAdmin'
];

app.use(function (req, res, next) {
    return next();
});
if (/^[0-9]+$/.test(portNumberCommandLineInput) && parseInt(portNumberCommandLineInput) > 0 && parseInt(portNumberCommandLineInput) <= 65535) {
    httpServerPort = portNumberCommandLineInput
} else {
    console.log('Введен некорректный порт.', portNumberCommandLineInput)
}

validateIncomingMessage = (message) => {
    let validated = true;
    if (validated) {
        return {
            error: false,
            errorComment: 'All ok'
        }
    } else {
        return {
            error: true,
            errorComment: 'Here will be errorComment'
        }
    }

};

processIncomingMessage = (message, ws, req) => {
    if (message === 'setAdmin' && adminOnLine === '') {
        adminOnLine = req.headers['sec-websocket-key'];
        console.log('Setting admin for: ', req.headers['sec-websocket-key'])
    } else if (message === 'setAdmin' && adminOnLine !== '') {
        console.log('message: ', message, ' Only one admin at a time is allowed for now. Admin is connected on:', adminOnLine)
    }
    // Деактивация админской сессии
    if (message === 'removeAdmin' && adminOnLine !== '') {
        adminOnLine = '';
        console.log('Removed admin for: ', req.headers['sec-websocket-key'])
    }
    // iterate over connected clients
    for (var key in clients) {
        // обработка сообщений пользователям
        // message.split('#')[1] - iD коннекта пользователя
        // key !== adminOnLine - чтобы не дублировать
        if ((key === req.headers['sec-websocket-key'] || key === message.split('#')[1]) && key !== adminOnLine && message !== 'keepAlive') {
            // clients[key].ws.send(message.split('#')[0]);
            clients[key].ws.send(`${message}#${req.headers['sec-websocket-key']}`);
        }
    }
    if (adminOnLine && systemCommands.indexOf(message) === -1 && message !== 'keepAlive') {
        // В конец добавляется iD отправителя сообщения
        let messageToAdmin = `${message}#${req.headers['sec-websocket-key']}`;
        clients[adminOnLine].ws.send(messageToAdmin);
        console.log('Sending message from Admin   :      ', messageToAdmin);
        console.log('                      from   :      ', req.headers['sec-websocket-key']);
    }
};

// подключенные клиенты
const clients = {};
// id коннекта Админа чата
let adminOnLine = '';
app.ws('/', function(ws, req) {
    clients[req.headers['sec-websocket-key']] = {
        'ws': ws
    };
    console.log("новое соединение: " + req.headers['sec-websocket-key']);

    ws.on('message', (message) => {
        console.log('получено сообщение ' + message + ' от ' + req.headers['sec-websocket-key']);
        if (!validateIncomingMessage.error) {
            processIncomingMessage(message, ws, req)
        } else {
            console.log(validateIncomingMessage.errorComment)
        }
        // Запрос активации админской сессии. Проверка нет ли уже запущенной
    });

    ws.on('close', () => {
        console.log('соединение закрыто ' + req.headers['sec-websocket-key']);
        delete clients[req.headers['sec-websocket-key']];
        // remove admin on closed connection from admin page
        if (req.headers['sec-websocket-key'] === adminOnLine) {
            adminOnLine = '';
            console.log('admin connection closed for: ', req.headers['sec-websocket-key'])
        }
    });

});

app.use(express.static('js'));
app.use(express.static('styles'));
app.use(express.static('images'));
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});
app.listen(process.env.PORT || httpServerPort, () => {
    console.log('--------------------------------------');
    console.log(`--> Server running on port ${httpServerPort}`);
    console.log('--------------------------------------');
});

