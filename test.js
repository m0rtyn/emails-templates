'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.prodazha-optom.ru',
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
let pathToHtml = 'dist/index.html';
let pathToTxt = 'plain-text/bolshie_diametry.txt';
let mailOptions = {
    from: '"Володя" <pidr@prodazha-optom.ru>', // sender address
    to: 'zogacc@gmail.com, afro.funky.lover@gmail.com', // list of receivers
    subject: 'Где выгодно купить большие диаметры запорной арматуры и элементов трубопровода?', // Subject line
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