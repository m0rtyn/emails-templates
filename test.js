'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    auth: {
        user: 'supportnoob@mail.ru',
        pass: 'bravenewpassw0rd'
    }
});

// setup email data with unicode symbols
let pathToHtml = 'indexes/flancy.html';
let pathToTxt = 'plain-text/flancy.txt';
let mailOptions = {
    from: '"Володя" <supportnoob@mail.ru>', // sender address
    to: 'poll-788@yandex.ru', // list of receivers
    subject: 'тест метаданных google', // Subject line
    text: fs.readFileSync(pathToTxt, 'utf8'),
    html: fs.readFileSync(pathToHtml, 'utf8')
};

// send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});