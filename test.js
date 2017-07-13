var nodemailer = require('nodemailer');
const fs = require('fs');

let transporter = nodemailer.createTransport({
    host: 'smtp2.gidroteh-expert.ru',
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

let email = 'web-6roel@mail-tester.com';
let htmlPath = 'dist/index.html';
let txtPath = 'plain-text/galeznik.txt';


let mailOptions = {
    from: '"ТД Армасети" <sale@gidtoteh-expert.ru>', // sender address
    to: email, // list of receivers
    subject: 'subject #4',
    headers: {
        "List-Unsubscribe": `<http://gidroteh-expert.ru/unsubscribe/447447574654/58675865/7tftf65d7rd75d54d>`,
        "list-id" : `test sending`,
    },
    envelope : {
        from : '"Bounce" <abuse@gidroteh-expert.ru>',
        to : email
    },
    replyTo : '"ТД Армасети" <sale@gidroteh-expert.ru>',
    text: template(fs.readFileSync(txtPath, 'utf8'), {
        email: email,
        unsub: `http://gidroteh-expert.ru/unsubscribe/447447574654/58675865`
    }),// Subject line {email: item.email}
    html: template(fs.readFileSync(htmlPath, 'utf8'), {
        email: email,
        unsub: `http://gidroteh-expert.ru/unsubscribe/447447574654/58675865`
    }) // html body
};
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.error(error);
    }
    console.log(info);
});
function template(text, option){
    return Object.keys(option).reduce(function (sum, current) {
        return sum.replace(new RegExp(`\\[\\(${current}\\)\\]`, 'gi'),option[current]);
    },text);
}