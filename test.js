'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'gidroteh-expert.ru',
    port: 465,
    pool: true,
    secure: true, // use TLS
    auth: {
        user: 'user1',
        pass: 'password1'
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }

});



// setup email data with unicode symbols
let pathToHtml = 'indexes/klapany_obratnye_chugunnye.html';
let pathToTxt = 'plain-text/klapany_obratnye_chugunnye.txt';
let mailOptions = {
    from: '"Володя" <volodya@gidroteh-expert.ru>', // sender address
    to: 'lebedko.alexander@gmail.com', // list of receivers
    subject: 'Клапаны чугунные из Китая в на складе', // Subject line
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