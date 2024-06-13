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

const { verify } = require('hcaptcha');

function generateToken(params = {}) {
    /*
    return jwt.sign(params, auth.jwt_secret_key, {
        expiresIn: '1d' // 1 dia
    });*/

    return jwt.sign(params, auth.jwt_secret_key); //never expire
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
                    message: 'Nome de usuário inválido!' 
                });
            } else if (!functions.validName(value)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Nome de usuário inválido!' 
                });
            } else if (typeof value == undefined || value === "" || value === null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Nome de usuário inválido!' 
                });
            } else if (userTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Nome de usuário em uso!' 
                });
            } else if (functions.strtolower(value.substr(0,4)) === "mod_" || functions.strtolower(value.substr(0,4)) === "mod-" || functions.strtolower(value.substr(0,3)) === "m0d" || functions.strtolower(value.substr(0,4)) === "adm-" || functions.strtolower(value.substr(0,4)) === "adm_" || functions.strtolower(value.substr(0,5)) === "radio" || functions.strtolower(value.substr(0,6)) === "radio-" || functions.strtolower(value.substr(0,6)) === "radio_" || functions.strtolower(value.substr(0,3)) === "ceo" || functions.strtolower(value.substr(0,3)) === "ce0" || functions.strtolower(value.substr(0,4)) === "ceo_" || functions.strtolower(value.substr(0,4)) === "ceo-") {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'O prefixo ' + value.toUpperCase().substr(0,4) + ' só pode ser utilizado por STAFFS!'
                });    
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: 'Nome de usuário válido!' 
                });
            }
        } else if (action == 'email') {
            const { value } = req.body;
            const emailTaken = await PlayerModel.findOne({ attributes: { include: ['email'] }, where: { email: value } });

            if (value === null || value.trim() === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Informe um e-mail.' 
                }); 
            } else if (!functions.validateEmail(value)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Informe um e-mail válido.' 
                }); 
            } else if (emailTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Este e-mail já está em uso.' 
                });
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: 'E-mail válido!' 
                });
            }
        } else if (action == 'password') {
            const { value } = req.body;
            if (value === null || value === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Informe uma senha.' 
                });
            } else if (value.length < 6) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'A senha deve ter no mínimo 6 caracteres.' 
                });
            } else {
                return res.status(200).json({
                    error: false, 
                    status_code: 200, 
                    message: 'Senha válido!' 
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
                    message: 'O nome de usuário não pode ficar <b>vázio</b>!' 
                }); 
            } else if (!functions.preg_match(username, /^[\.\,a-zA-Z0-9_-]+$/i)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Nome de usuário inválido. Somente letras, números, pontos, vírgulas, underlines e traços são permitidos.' 
                });
            } else if (!functions.validName(username)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Nome de usuário inválido. Deve ter no <b>mínimo 2 e no máximo 20 caracteres</b>.' 
                }); 
            } else if (userTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'O usuário <b> ' + username + '</b> já está sendo usado!' 
                });            
            } else if (functions.strtolower(username.substr(0,4)) === "mod_" || functions.strtolower(username.substr(0,4)) === "mod-" || functions.strtolower(username.substr(0,3)) === "m0d" || functions.strtolower(username.substr(0,4)) === "adm-" || functions.strtolower(username.substr(0,4)) === "adm_" || functions.strtolower(username.substr(0,5)) === "radio" || functions.strtolower(username.substr(0,6)) === "radio-" || functions.strtolower(username.substr(0,6)) === "radio_" || functions.strtolower(username.substr(0,3)) === "ceo" || functions.strtolower(username.substr(0,3)) === "ce0" || functions.strtolower(username.substr(0,4)) === "ceo_" || functions.strtolower(username.substr(0,4)) === "ceo-") {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'O prefixo <b>' + username.toUpperCase().substr(0,4) + '</b> só pode ser utilizado por STAFFS!'
                });    
            } else if (email === null || email === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Você precisa do <b>seu endereço de e-mail</b>!' 
                }); 
            } else if (!functions.validateEmail(email)) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'O <b>endereço de e-mail</b> fornecido é <b>inválido</b>!' 
                }); 
            } else if (emailTaken !== null) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'O <b>endereço de e-mail</b> fornecido já está em uso!' 
                });
            } else if (password === null || password === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Você precisa fornecer uma <b>senha segura</b> para sua conta!' 
                });
            } else if (password.length < 6) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Sua senha deve conter <b>no mínimo 6 caracteres </b>' 
                });
            } else if (gender === null || gender === '') {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: '<b>Escolha o seu sexo</b> e, com ele, consiga um parceiro incrível!'
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
                                    message: '<b>Verifique se você é um robô</b>!'
                                });               
                            }
                        }
                    } else {
                        return res.status(200).json({
                            error: true, 
                            status_code: 400, 
                            message: '<b>Verifique se você é um robô</b>!'
                        });  
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    }
}