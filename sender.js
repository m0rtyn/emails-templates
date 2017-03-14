var nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
let url = 'mongodb://localhost:27017/mailsender';

let config = {
    group: '2',
    text: 'plain-text/flancy.txt',
    html: 'indexes/flancy.html',
    subject: 'Стальные фланцы из первых рук!',
    titleInDB : 'Стальные фланцы из первых рук!'
};

function createTransport(callback) {
    let transporter = nodemailer.createTransport({
        name: 'prodazha-optom.ru',
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
        findRecipients(db, function (list, campaignID) {
            sendToList(list, transporter, db, campaignID);
        });
    });
});
//ObjectId("58c1110ccd9d47c1f1940a29")
function findRecipients(db, callback) {
    contacts_collection = db.collection('contacts');
    campaign_collection = db.collection('campaign');
    campaign_collection.findOne({title: config.titleInDB}, function (err, campaign) {
        if (campaign) {
            contacts_collection.find({
                "fields.group": config.group,
                "status": "subscriber",
                "activities.target": {
                    $ne: campaign._id
                }
            }).toArray(function (err, list) {
                console.log(`будет отправлено ${list.length}`);
                callback(list, campaign._id);
            });

        } else {
            return console.error(new Error(`Компании ${config.titleInDB} нет в базе данных!`));
        }
    });
}

function sendToList(list, transporter, db, campaignID) {
    let text = fs.readFileSync(config.text, 'utf8');
    let html = fs.readFileSync(config.html, 'utf8');
    sendAsync(0);
    function sendAsync(offset){
        if (offset == list.length) return console.log('done!');
        let _id = list[offset]._id.toString();
        let email = template(html, {email: list[offset].email, unsub: `http://prodazha-optom.ru/unsubscribe/${_id}`});
        email = addPixel(email,campaignID.toString(), _id );
        let mailOptions = {
            headers: {
                "List-Unsubscribe": `<http://prodazha-optom.ru/unsubscribe/${_id}>`,
                "X-User-ID": _id,
                "X-Campaign-ID": campaignID.toString()
            },
            from: '"ТД Армасети" <sale@prodazha-optom.ru>', // sender address
            to: list[offset].email, // list of receivers
            subject: config.subject,
            text: template(text, {email: list[offset].email, unsub: `http://prodazha-optom.ru/unsubscribe/${_id}`}),// Subject line {email: item.email}
            html: email // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(`error, try reload [${list[offset].email}] \t\t ${offset} from ${list.length}`);
                return createTransport(function (transporter) {
                    findRecipients(db, function (list, campaignID) {
                        sendToList(list, transporter, db, campaignID);
                    });
                });
            } else {
                db.collection('contacts').updateOne({email:list[offset].email}, {
                    $push: {
                        activities: {
                            action: 'send',
                            target: campaignID,
                            timestamp: new Date()
                        }
                    }
                }, function (err, resp) {
                    console.log(`[${list[offset].email}] \t\t ${offset} from ${list.length}`);
                    sendAsync(offset+1);
                });
            }
        });
    }

}

function addPixel(emailWithoutAnchor, campaignID, contactID) {
    let pixel = `<img src="http://prodazha-optom.ru/tracker/${contactID}/${campaignID}" alt="pixel" style="-ms-interpolation-mode:bicubic;clear:both;display:block;max-width:100%;outline:0;text-decoration:none;width:auto">`;
    return emailWithoutAnchor.replace(/<body\b[^>]*>/,`$&${pixel}`);
}

function template(text, option){
    return Object.keys(option).reduce(function (sum, current) {
        return sum.replace(new RegExp(`\\[\\(${current}\\)\\]`, 'gi'),option[current]);
    },text);
}