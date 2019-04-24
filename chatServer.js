const path = require('path');
const express = require('express');
const app = express();
var expressWs = require('express-ws')(app);
let httpServerPort = 8080;
const portNumberCommandLineInput = process.argv.slice(2)[0];
// служебные сообщения, которые не надо маршрутизировать
const systemCommands = [ 'setAdmin', 'removeAdmin', 'initConnection', 'keepAlive'];
const validMessageFields = ['messageText', 'userName', 'wsChatKey'];
const clients = {};
let adminOnLine = ''; // id коннекта Админа чата

app.use(function (req, res, next) {
    return next();
});
if (/^[0-9]+$/.test(portNumberCommandLineInput) && parseInt(portNumberCommandLineInput) > 0 && parseInt(portNumberCommandLineInput) <= 65535) {
    httpServerPort = portNumberCommandLineInput
} else {
    console.log('Введен некорректный порт.', portNumberCommandLineInput)
}

isValidJSON = (text) => {
    const result = {
        isValid: true,
        error: ''
    };
    try {
        JSON.parse(text);
    }
    catch (e) {
        result.isValid = false;
        result.error = e;
    }
    return result;
};

validateIncomingMessage = (rawMessage) => {
    // 'userName' String, *required
    // 'messageText': String, *required
    // 'wsChatKey': String
    const result = {
        validated: true,
        error: {},
        rawMessage
    };
    // here validate for SYSTEM messages
    // ------------

    // validate JSON message format
    const validateJsonMessage = isValidJSON(rawMessage);
    if (validateJsonMessage.isValid === false) {
        console.log(validateJsonMessage);
        result.validated = false;
        result.error = validateJsonMessage.error;
        return result
    }
    const message = JSON.parse(rawMessage);
    // validate required fields
    if (Object.keys(message).indexOf('userName') === -1) {
        result.validated = false;
        result.error['userName'] = 'userName field is required'
    } else if (Object.keys(message).indexOf('messageText') === -1) {
        result.validated = false;
        result.error['messageText'] = 'messageText field is required'
    }
    // else if (Object.keys(message).indexOf('wsChatKey') === -1) {
    //     result.validated = false;
    //     result.error['wsChatKey'] = 'wsChatKey field is required'
    // }
    else if (message.userName.length < 4 || message.userName.length > 12) {
        result.validated = false;
        result.error['userName'] = 'userName must be between 4 and 12 symbols'
    } else if (!/^[a-zA-Zа-яА-Я0-9 ]+$/.test(message.userName)) {
        result.validated = false;
        result.error = 'userName must contain only letters and digits'
    } else if (message.messageText.replace(' ').length === 0 || message.messageText.length > 120) {
        result.validated = false;
        result.error['messageText'] = 'Message body must not be empty or longer then 120 letters';
    } else if (!/^[a-zA-Zа-яА-Я0-9  ?!.,_:;()-]+$/.test(message.messageText)) {
        result.validated = false;
        result.error['messageText'] = 'Message body must contain only letters and digits no special symbols';
    } else if (message.wsChatKey !== undefined && message.wsChatKey.length !== 24) {
        // validate wsChatKey. Need regex pattern. Length only for now
        result.validated = false;
        result.error['wsChatKey'] = 'Invalid length of sec-websocket-key';
    }
    if (!result.validated) {
        console.log('validation result: ', result);
    }
    return result
};

processSystemCommand = (message, ws, req) => {
    if (message.messageText !== 'keepAlive') {
        console.log('получено сообщение ' + JSON.stringify(message) + ' от ' + req.headers['sec-websocket-key']);
    }
    // Запрос активации админской сессии. Проверка нет ли уже запущенной
    if (message.messageText === 'setAdmin' && adminOnLine === '') {
        adminOnLine = req.headers['sec-websocket-key'];
        console.log('Setting admin for: ', req.headers['sec-websocket-key'])
    } else if (message.messageText === 'setAdmin' && adminOnLine !== '') {
        console.log('message: ', message.messageText, ' Only one admin at a time is allowed for now. Admin is connected on:', adminOnLine)
    }
    // Деактивация админской сессии
    else if (message.messageText === 'removeAdmin' && adminOnLine !== '') {
        adminOnLine = '';
        console.log('Removed admin for: ', req.headers['sec-websocket-key'])
    }
};

checkForExistingConnection = (wsChatKey) => {
    return Object.keys(clients).indexOf(wsChatKey) !== -1
};

processIncomingMessage = (message, ws, req) => {
    const offlineMessage = {
        userName: 'Admin',
        messageText: 'Администратор оффлайн',
        wsChatKey: req.headers['sec-websocket-key']
    };
    if (adminOnLine === '') {
        clients[req.headers['sec-websocket-key']].ws.send(JSON.stringify(offlineMessage));
        console.log('Admin offline');
        return
    }
    // USER --> SERVER --> ADMIN:
    if (adminOnLine !== '' && req.headers['sec-websocket-key'] !== adminOnLine) {
        // processing message from USER to SERVER
        const outgoingMessage = {...message};
        outgoingMessage['wsChatKey'] = req.headers['sec-websocket-key'];
        // echo message to sender
        clients[req.headers['sec-websocket-key']].ws.send(JSON.stringify(outgoingMessage));
        // echo message to sender
        clients[adminOnLine].ws.send(JSON.stringify(outgoingMessage));
        console.log('USER --> SERVER --> ADMIN message: ', outgoingMessage)
    }
    // ADMIN --> SERVER --> USER:
    if (req.headers['sec-websocket-key'] === adminOnLine) {
        console.log('processing admin message: ', message);
        const outgoingMessage = {...message};
        const userWsChatKey = outgoingMessage.wsChatKey;
        // echo message to sender:
        clients[userWsChatKey].ws.send(JSON.stringify(outgoingMessage));
        // echo message to ADMIN:
        clients[adminOnLine].ws.send(JSON.stringify(outgoingMessage));
        console.log('ADMIN --> SERVER --> USER: message', outgoingMessage)

    }
};

app.ws('/', function(ws, req) {
    clients[req.headers['sec-websocket-key']] = {
        'ws': ws
    };
    console.log("новое соединение от: " + req.headers['sec-websocket-key']);

    ws.on('message', (message) => {
        const validationResult = validateIncomingMessage(message);
        if (validationResult.validated === true) {
            const parsedMessage = JSON.parse(message);
            if (systemCommands.indexOf(parsedMessage.messageText) !== -1) {
                processSystemCommand(parsedMessage, ws, req)
            } else {
                console.log('Message received: ', message);
                processIncomingMessage(parsedMessage, ws, req)
            }
        }
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

