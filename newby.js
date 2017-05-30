var nodemailer = require('nodemailer');
var validator = require("email-validator");
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const CronJob = require('cron').CronJob;
const job = new CronJob({
    cronTime: '00 00 05 * * 1-5',
    'onTick': onTick,
    start: false
});

//job.start();
onTick();
function onTick(_config) {
    let config = _config ? _config : getConfig();
    if (config) {
        connectToDB(db => {
            if (db) {
                createTransport(transporter => {
                    findRecipients(db, config, (err, list, campaignID) => {
                        if (err) {
                            console.error(err);
                            db.close();
                            transporter.close();
                            return onTick(config);
                        }
                        sendToList(list, transporter, db, campaignID, config);
                    });
                });
            } else {
                return onTick(config);
            }
        });
    } else return null;
}

function connectToDB(callback) {
    let url = 'mongodb://localhost:27017/mailsender';
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.error(err);
            return callback(null);
        }
        console.log("Connected correctly to server");
        return callback(db);
    });
}

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

function getConfig() {
    let today = new Date();
    let dayOfMonth = today.getDate();
    let dayOfWeek = today.getDay();

    return config = {
        group: `6`,//group: `${5 + dayOfWeek}`,
        text: 'plain-text/welcome.txt',
        html: 'indexes/welcome.html',
        subject: 'Наши цены за запорную арматуру стабильно-низкие!',
        titleInDB: 'Приветствующее письмо'
    };

}

function findRecipients(db, config, callback) {
    contacts_collection = db.collection('contacts');
    campaign_collection = db.collection('campaign');
    campaign_collection.findOne({title: config.titleInDB}, function (err, campaign) {
        if (campaign) {
            contacts_collection.aggregate([
                {
                    $match: {
                        //"fields.group": config.group,
                        "status": "subscribe",
                        "activities" : { $size : 0 }
                        // "activities.target": {
                        //     $ne: campaign._id
                        // }
                    }
                }, {
                    $project: {
                        email: 1,
                        _id: 1
                    }
                }], function (err, list) {
                if (err) return callback(new Error(`MongoDB timeout error`));
                console.log(`будет отправлено ${list.length}`);
                return callback(null, list, campaign._id);
            });
        } else {
            return callback(new Error(`Компании ${config.titleInDB} нет в базе данных!`));
        }
    });
}

function sendToList(list, transporter, db, campaignID, config) {
    let text = fs.readFileSync(config.text, 'utf8');
    let html = fs.readFileSync(config.html, 'utf8');
    let _campaignID = campaignID.toString();
    sendAsync(0);
    function sendAsync(offset) {
        if (offset === list.length) {
            db.close();
            console.log('Mongo connection close');
            transporter.close();
            console.log('SMTP connection close');
            return console.log('done!');
        } else {
            let validateEmail = validator.validate(list[offset].email);
            if (validateEmail) {
                let _id = list[offset]._id.toString();
                let email = template(html, {
                    email: list[offset].email,
                    unsub: `http://prodazha-optom.ru/unsubscribe/${_id}/${_campaignID}`
                });
                email = addPixel(email, _campaignID, _id);
                let mailOptions = {
                    headers: {
                        "List-Unsubscribe": `<http://prodazha-optom.ru/unsubscribe/${_id}/${_campaignID}>`,
                        "X-User-ID": _id,
                        "X-Campaign-ID": _campaignID
                    },
                    from: '"ТД Армасети" <sale@prodazha-optom.ru>', // sender address
                    to: list[offset].email, // list of receivers
                    subject: config.subject,
                    text: template(text, {
                        email: list[offset].email,
                        unsub: `http://prodazha-optom.ru/unsubscribe/${_id}/${_campaignID}`
                    }),// Subject line {email: item.email}
                    html: email // html body
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error(error);
                        console.error(`error, try reload [${list[offset].email}] \t\t ${offset} from ${list.length}`);
                        db.close();
                        transporter.close();
                        return onTick(config);
                    } else {
                        db.collection('contacts').updateOne({email: list[offset].email}, {
                            $push: {
                                activities: {
                                    action: 'queued',
                                    target: campaignID,
                                    timestamp: new Date()
                                }
                            }
                        }, function (err, resp) {
                            console.log(`[${config.group}-${config.titleInDB}] \t [${list[offset].email}] \t ${offset} from ${list.length}`);
                            sendAsync(offset + 1);
                        });
                    }
                });
            } else {
                db.collection('contacts').remove({email: list[offset].email}, function () {
                    console.log(`[${list[offset].email}] \t\t ${offset} from ${list.length} remove`);
                    sendAsync(offset + 1);
                });
            }
        }
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
