const { default: axios } = require('axios');
const fs = require('fs');
const { send } = require('process');
const { Client, Location, MessageMedia } = require('whatsapp-web.js');
const SESSION_FILE_PATH = '../../session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const imageUrlToBase64 = async(url) => {
    let image = await axios.get(url, {responseType: 'arraybuffer'});
    let raw = Buffer.from(image.data).toString('base64');
    return new MessageMedia(
        'image/png',
        raw,
    )
}

const client = new Client({ puppeteer: { headless: false }, session: sessionCfg });
// You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.
// This object must include WABrowserId, WASecretBundle, WAToken1 and WAToken2.

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});


var greetings = 'Hi, selamat datang di OrderDela !\nDisini kami menyediakan pelayanan jasa service dilokasi terdekat dan juga bisa service home atau bahkan service panggilan dimanapun anda berada.\nUntuk memilih pelayanan kami silakan pilih angka berikut :\n1.service bengkel terdekat\n2.service home\n3.service panggilan\n\nCukup ketik angkanya saja untuk memilih !\nTerimakasih';

var services = [
    {
        'id': 401,
        'name': 'Care',
    },
    {
        'id': 402,
        'name': 'Emergency',
    }
]

var listServiceKecil = [
    {
        'id':4401,
        'name': 'Ganti Oli',
        'harga': 40000
    },
    {
        'id':4402,
        'name': 'Ganti '
    }
]

var bengkel = [{
    'name': 'Bengkel '
}]

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
    if(['p', 'P', 'halo', 'Halo', 'hai', 'Hei', 'Hay', 'hay'].includes(msg.body)) {
        msg.reply(greetings)
    }else if(msg.body.startsWith('service ')){
        let code = msg.body.slice()
    }else if(msg.body.startsWith('cari ')){
        let keyword = msg.body.slice(5);
        axios.get('https://apisrv.frodo.id/v1/product', {
            params: {
                s: keyword
            }
        })
        .then((response) => {
            let data = response.data.data
            if(data.length < 1) {
                client.sendMessage(msg.from, 'Mohon Maaf Menu ' + keyword + ' belum ada di tempat kami.' )
            }else{
                data.forEach((item) =>  {
                    imageUrlToBase64(item.photo)
                        .then((res) => {
                            client.sendMessage(msg.from , res, {
                                caption: 'Nama : ' + item.name +'\n' +
                                        'Harga : ' + item.price + '\n'
                            });
                        })
                    // console.log(item);
                    // console.log('image', imageUrlToBase64(item.photo))
                    // client.sendMessage(msg.from , imageUrlToBase64(item.photo), {
                    //     caption: 'Name : ' + item.name, 
                    // });
                })
            }
        });
    }
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }
});

client.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg.body); // message before it was deleted.
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if(ack == 3) {
        // The message was read
    }
});

client.on('group_join', (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    notification.reply('User joined.');
});

client.on('group_leave', (notification) => {
    // User has left or been kicked from the group.
    console.log('leave', notification);
    notification.reply('User left.');
});

client.on('group_update', (notification) => {
    // Group picture, subject or description has been updated.
    console.log('update', notification);
});

client.on('change_battery', (batteryInfo) => {
    // Battery percentage for attached device has changed
    const { battery, plugged } = batteryInfo;
    console.log(`Battery: ${battery}% - Charging? ${plugged}`);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});


exports.init = function() {
    client.initialize();
}