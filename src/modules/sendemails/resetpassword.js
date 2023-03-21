const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('config');

require('dotenv').config();

module.exports = {
    async sendEmail(email, subject, username, hotelname, keylink) {
        const filePath = path.join(__dirname, '../../view/templates/resetpassword.html');
        const source = fs.readFileSync(filePath, 'utf-8').toString();

        const template = handlebars.compile(source);

        const replacements = {
            username: username,
            hotelname: hotelname,
            keylink: keylink
        };

        const htmlToSend = template(replacements);
        const transporter = nodemailer.createTransport({
            host: config.get('cms_config').configSendmail.mailServerHost,
            port: config.get('cms_config').configSendmail.mailServerPort, // 587
            secure: false,
            requireTLS: true,
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASSWORD
            }
          });
          var mailOptions = {
            from: 'Equipe CrazzY',
            to: email,
            subject: subject,
            html: htmlToSend
          };
          
          await transporter.sendMail(mailOptions);
    }
}