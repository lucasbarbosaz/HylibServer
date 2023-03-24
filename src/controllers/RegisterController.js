const sequelize = require('sequelize');
const auth = require('../config/auth.json');
const bcrypt = require('bcryptjs');
const PlayerModel = require('../database/models/Player');
const RegisterModel = require('../database/models/Register');
const config = require('config');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const jwt = require('jsonwebtoken');
const functions = require('../modules/functions');
const i18n = require('../translation/i18n');

const { verify } = require('hcaptcha');

function generateToken(params = {}) {
    return jwt.sign(params, auth.jwt_secret_key, {
        expiresIn: '1d' // 1day
    });
}


module.exports = {

    async check(req, res) {
        const { action } = req.body;

        if (action == 'username') {
            const { value } = req.body;
            const userTaken = await PlayerModel.findOne({ attributes: { include: ['username'] }, where: { username: value } });

            if (!functions.preg_match(value, /^[\.\,a-zA-Z0-9_-]+$/i)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkNameInvalid')
                });
            } else if (!functions.validName(value)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkNameInvalid')
                });
            } else if (typeof value == undefined || value === "" || value === null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkNameInvalid')
                });
            } else if (userTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkUserTaken')
                });
            } else if (functions.strtolower(value.substr(0,4)) === "mod_" || functions.strtolower(value.substr(0,4)) === "mod-" || functions.strtolower(value.substr(0,3)) === "m0d" || functions.strtolower(value.substr(0,4)) === "adm-" || functions.strtolower(value.substr(0,4)) === "adm_" || functions.strtolower(value.substr(0,5)) === "radio" || functions.strtolower(value.substr(0,6)) === "radio-" || functions.strtolower(value.substr(0,6)) === "radio_" || functions.strtolower(value.substr(0,3)) === "ceo" || functions.strtolower(value.substr(0,3)) === "ce0" || functions.strtolower(value.substr(0,4)) === "ceo_" || functions.strtolower(value.substr(0,4)) === "ceo-") {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkPrefixBlock', { prefix: value.toUpperCase().substr(0,4)})
                });    
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: i18n.__('checkUserValid')
                });
            }
        } else if (action == 'email') {
            const { value } = req.body;
            const emailTaken = await PlayerModel.findOne({ attributes: { include: ['email'] }, where: { email: value } });

            if (value === null || value.trim() === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkEmailRequired')
                }); 
            } else if (!functions.validateEmail(value)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkEmailInvalid')
                }); 
            } else if (emailTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkEmailTaken')
                });
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: i18n.__('checkEmailValid')
                });
            }
        } else if (action == 'password') {
            const { value } = req.body;
            if (value === null || value === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkPasswordRequired') 
                });
            } else if (value.length < 6) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('checkPasswordLength') 
                });
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: i18n.__('checkPasswordValid') 
                });
            }
        }
    },

    async register(req, res) {
        try {
            const { username, email, password, gender, hCaptcha } = req.body;

            const date = new Date();


            const userTaken = await PlayerModel.findOne({ attributes: { include: ['username'] }, where: { username: username } });
            const emailTaken = await PlayerModel.findOne({ attributes: { include: ['email'] }, where: { email: email } });

            if (username === null || username === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerUsernameRequired') 
                }); 
            } else if (!functions.preg_match(username, /^[\.\,a-zA-Z0-9_-]+$/i)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerUsernameInvalid') 
                });
            } else if (!functions.validName(username)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerInvalidName')
                }); 
            } else if (userTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerNameTaken', { username: username })
                });            
            } else if (functions.strtolower(username.substr(0,4)) === "mod_" || functions.strtolower(username.substr(0,4)) === "mod-" || functions.strtolower(username.substr(0,3)) === "m0d" || functions.strtolower(username.substr(0,4)) === "adm-" || functions.strtolower(username.substr(0,4)) === "adm_" || functions.strtolower(username.substr(0,5)) === "radio" || functions.strtolower(username.substr(0,6)) === "radio-" || functions.strtolower(username.substr(0,6)) === "radio_" || functions.strtolower(username.substr(0,3)) === "ceo" || functions.strtolower(username.substr(0,3)) === "ce0" || functions.strtolower(username.substr(0,4)) === "ceo_" || functions.strtolower(username.substr(0,4)) === "ceo-") {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerNamePrefix', { prefix: username.toUpperCase().substr(0,4) })
                });    
            } else if (email === null || email === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerEmailRequired')
                }); 
            } else if (!functions.validateEmail(email)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerEmailInvalid')
                }); 
            } else if (emailTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerEmailTaken')
                });
            } else if (password === null || password === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerPasswordRequired')
                });
            } else if (password.length < 6) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerPasswordLength')
                });
            } else if (gender === null || gender === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: i18n.__('registerGenderRequired')
                }); 
            } else {
                const getTotalIp = await db.query("SELECT ip_last FROM players WHERE ip_last = ?", {
                    replacements: [ requestIp.getClientIp(req)], type: sequelize.QueryTypes.SELECT
                });

                if (getTotalIp.length < config.get('cms_config').registerSettings.maxAccountsPerIp) {
                    if (hCaptcha) {
                        if (config.get('cms_config').hCaptcha.enabled) {
                            let { success } = await verify(process.env.TOKEN_SECRET, hCaptcha);
                            
                            if (success) {

                                let genero = gender == "male" ? "M" : "F"; 
                                let motto = config.get('cms_config').registerSettings.startMotto;
                                let timestamp = Math.floor(Date.now()/1000);
                                let avatar = genero === "M" ? config.get('cms_config').registerSettings.avatarM : config.get('cms_config').registerSettings.avatarF;
                                let dateNow = moment.unix(Math.floor(Date.now()/1000));

                                const addNewUser = await RegisterModel.create({ 
                                    username: username,
                                    figure: avatar,
                                    motto: motto,
                                    credits: config.get('cms_config').registerSettings.credits,
                                    vip_points: config.get('cms_config').registerSettings.diamonds,
                                    activity_points: config.get('cms_config').registerSettings.duckets,
                                    rank: '1',
                                    email: email,
                                    password: password,
                                    gender: genero == "M" ? "M" : "F",
                                    reg_timestamp: timestamp,
                                    reg_date: dateNow.format("DD-MM-YYYY"),
                                    last_online: timestamp,
                                    ip_last: requestIp.getClientIp(req),
                                    ip_reg: requestIp.getClientIp(req)
                                 });

                                 const user = await db.query("SELECT id,username,motto,figure,last_online,online,rank,vip_points,credits,activity_points,seasonal_points FROM players WHERE id = ?", {
                                    replacements: [ addNewUser.id ], type: sequelize.QueryTypes.SELECT
                                });

                                var userArray = [];

                                for (var i = 0; i < user.length; i++){
                                    userArray.push({
                                        id: user[i].id,
                                        username: user[i].username,
                                        motto: user[i].motto,
                                        figure: user[i].figure,
                                        last_online: user[i].last_online,
                                        online: user[i].online == '1',
                                        diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
                                        credits: functions.formatCount(parseInt(user[i].credits), true),
                                        duckets: functions.formatCount(parseInt(user[i].activity_points), true),
                                        seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
                                        canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
                                    })
                                }

                                //add user ip in token for future security check
                                const token = generateToken({ id: addNewUser.id, ip: requestIp.getClientIp(req) })
                                return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });  
                            } else {
                                return res.status(200).json({
                                    error: true, 
                                    status_code: 400, 
                                    message: i18n.__('registerCaptchaError')
                                });               
                            }
                        }
                    } else {
                        return res.status(200).json({
                            error: true, 
                            status_code: 400, 
                            message: i18n.__('registerCaptchaError')
                        });  
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    }
}