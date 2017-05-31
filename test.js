var nodemailer = require('nodemailer');
const fs = require('fs');

let transporter = nodemailer.createTransport({
    host: 'smtp.prodazha-optom.ru',
    port: 465,
    pool: true,
    secure: true, // use TLS
    auth: {
        user: 'abuse@prodazha-optom.ru',
        pass: 'password1'
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
});

let email = 'zogacc@gmail.com';
let htmlPath = 'dist/index.html';
let txtPath = 'plain-text/bolshie_diametry.txt';


let mailOptions = {
    from: '"ТД Армасети" <sale@prodazha-optom.ru>', // sender address
    to: email, // list of receivers
    subject: 'subject #3',
    headers: {
        "List-Unsubscribe": `<http://prodazha-optom.ru/unsubscribe/447447574654/58675865>`,
        "list-id" : `test sending`,
    },
    envelope : {
        from : '"Bounce" <abuse@prodazha-optom.ru>',
        to : email
    },
    replyTo : '"ТД Армасети" <sale@prodazha-optom.ru>',
    text: template(fs.readFileSync(txtPath, 'utf8'), {
        email: email,
        unsub: `http://prodazha-optom.ru/unsubscribe/447447574654/58675865`
    }),// Subject line {email: item.email}
    html: template(fs.readFileSync(htmlPath, 'utf8'), {
        email: email,
        unsub: `http://prodazha-optom.ru/unsubscribe/447447574654/58675865`
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