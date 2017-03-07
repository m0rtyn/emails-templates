var nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
let url = 'mongodb://localhost:27017/mailsender';

let config = {
    group: '2',
    size: 1,
    text: 'plain-text/zatvory.txt',
    html: 'indexes/zatvory.html',
    subject: 'Затворы по сниженным ценам ➡️ Дисковые затворы оптом из Китая'
};

function createTransport(callback) {
    let transporter = nodemailer.createTransport({
        name: 'prodazha-optom.ru',
        maxConnections: 50,
        maxMessages: 10,
        pool: true,
        port: 587,
        auth: {
            user: 'user1',
            pass: 'password1'
        }
    });
    return callback(transporter);
}

MongoClient.connect(url, function (err, db) {
    console.log("Connected correctly to server");
    createTransport(function (transporter) {
        findRecipients(db, function (list) {
            sendToList(list, transporter, db);
        });
    });
});

function findRecipients(db, callback) {
    contacts_collection = db.collection('contacts');
    contacts_collection.find({
        "fields.group": config.group,
        activities: {$size: config.size}}).toArray(function (err, list) {
        console.log(`будет отправлено ${list.length}`);
        callback(list);
    });
}

function sendToList(list, transporter, db) {
    let text = fs.readFileSync(config.text, 'utf8');
    let html = fs.readFileSync(config.html, 'utf8');
    sendAsync(0);
    function sendAsync(offset){
        if (offset == list.length) return console.log('done!');
        let mailOptions = {
            headers: {
                "List-Unsubscribe": "<http://prodazha-optom.ru/unsubscribe/7891212387>"
            },
            from: '"ТД Армасети" <sale@prodazha-optom.ru>', // sender address
            to: list[offset].email, // list of receivers
            subject: config.subject,
            text: template(text, {email: list[offset].email}),// Subject line {email: item.email}
            html: template(html, {email: list[offset].email}) // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(`error, try reload [${list[offset].email}] \t\t ${offset} from ${list.length}`);
                return createTransport(function (transporter) {
                    findRecipients(db, function (list) {
                        sendToList(list, transporter, db);
                    });
                });
            } else {
                db.collection('contacts').updateOne({email:list[offset].email}, { $push: {activities : {
                    action: 'send',
                    target : config.subject,
                    timestamp: new Date()
                }}}, function (err, resp) {
                    console.log(`[${list[offset].email}] \t\t ${offset} from ${list.length}`);
                    sendAsync(offset+1);
                });
            }
        });
    }

}

function template(text, option){
    return Object.keys(option).reduce(function (sum, current) {
        return sum.replace(new RegExp(`\\[\\(${current}\\)\\]`, 'gi'),option[current]);
    },text);
}