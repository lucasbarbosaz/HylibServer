const sequelize = require('sequelize');
const auth = require('../config/auth.json');
const bcrypt = require('bcryptjs');
const LoginPin = require('../database/models/CmsLoginPin');
const PlayerModel = require('../database/models/Player');
const ResetPassword = require('../database/models/ResetPassword');
const sendResetPasswordMail = require('../modules/sendemails/resetpassword');
const sendPinCodeMail = require('../modules/sendemails/pincode');
const config = require('config');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const jwt = require('jsonwebtoken');
const functions = require('../modules/functions');
const crypto = require('crypto')
var mt = require('../modules/mt_rand');
const i18n = require('../translation/i18n');

function generateToken(params = {}) {
    /*
    return jwt.sign(params, auth.jwt_secret_key, {
        expiresIn: '1d' // 1 dia
    });*/

    return jwt.sign(params, auth.jwt_secret_key); //never expire
}
module.exports = {

    async login(req, res) {
        try {
            const { identification, password } = req.body;

            const player = await PlayerModel.findOne({ where: { username: identification } });

            if (!player) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerNotFound')
                });
            } else if (typeof password === undefined || password.trim() === "" || password === null) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerWrong')
                });
            } else if (!bcrypt.compareSync(password, player.password)) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerWrong')
                });
            } else {
                if (config.get('cms_config').loginSettings.doubleAuthenticationEnabled && player.rank >= config.get('cms_config').loginSettings.doubleAuthenticationMinRank && requestIp.getClientIp(req) !== player.ip_last) {
                    const result = await PlayerModel.findByPk(player.id, {
                        include: { association: 'getPins', order: [['id', 'DESC']], limit: 1 },
                    });
					
					if (result.getPins.length > 0) {
						//convert object to int
						let string = JSON.stringify(result.getPins[0].timestamp);
						let lastAccessCode = string.replace(/[^0-9]*/g, '');

						let now = moment().unix();

						if ((parseInt(lastAccessCode) + (60 * 1)) > now) {
							return res.status(400).json({
								error: true,
								status_code: 400,
								message: i18n.__('pinMessage', { hotelName: config.get('cms_config').hotelName })
							});
						} else {
							let accessCode = mt(100000, 999999);

							const insertPinCode = await LoginPin.create({
								player_id: player.id,
								access_code: accessCode,
								timestamp: now,
								reg_ip: requestIp.getClientIp(req),
								enabled: '1'
							});

							if (insertPinCode) {
								sendPinCodeMail.sendEmail(player.email, i18n.__('pinSendEmail1', { hotelName: config.get('cms_config').hotelName }), player.username, accessCode)
							}

							return res.status(200).json({
								status_code: 204,
								action: 'login_pin',
							});
						}						
					} else {
						let accessCode = mt(100000, 999999);
						let now = moment().unix();
						
						const insertPinCode = await LoginPin.create({
							player_id: player.id,
							access_code: accessCode,
							timestamp: now,
							reg_ip: requestIp.getClientIp(req),
							enabled: '1'
						});
						
						if (insertPinCode) {
							sendPinCodeMail.sendEmail(player.email, i18n.__('pinSendEmail1', { hotelName: config.get('cms_config').hotelName }), player.username, accessCode)
						}

						return res.status(200).json({
							status_code: 204,
							action: 'login_pin',
						});							
					}

                } else {
                    const consultUserBan = await db.query("SELECT expire, reason FROM bans WHERE (data = ? OR data = ? OR data = ?)", {
                        replacements: [player.id, player.ip_reg, player.ip_last], type: sequelize.QueryTypes.SELECT
                    });

                    if (consultUserBan.length > 0) {
                        let time = moment().unix();
                        let timeBan = consultUserBan[0].expire;

                        if (timeBan == '0') {
                            let reason = consultUserBan[0].reason;
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: i18n.__('banPerman', { reason })
                            });
                        } else if (time < timeBan) {
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: i18n.__('banMessage', { time: moment.unix(consultUserBan[0].expire).format('YYYY-MM-DD HH:mm:ss'), reason: consultUserBan[0].reason })
                            });
                        } else if (time > timeBan) {
                            const deleteUserBan = await db.query("DELETE FROM bans WHERE data = ?", {
                                replacements: [player.id], type: sequelize.QueryTypes.DELETE
                            });

                            if (config.get('cms_config').maintenance && player.rank <= config.get('cms_config').cms_config.maintenanceMinimumRankLogin) {
                                return res.status(200).json({
                                    error: true,
                                    status_code: 400,
                                    message: i18n.__('maintenance', { hotelName: config.get('cms_config').hotelName })
                                });
                            }

                            if (player.ip_last != requestIp.getClientIp(req)) {
                                const updateIp = await PlayerModel.update({
                                    ip_last: requestIp.getClientIp(req)
                                }, {
                                    where: { id: player.id }
                                });
                            }

                            const user = await db.query("SELECT id,username,motto,figure,last_online,online,email,rank,vip_points,credits,activity_points,seasonal_points,vip FROM players WHERE id = ?", {
                                replacements: [player.id], type: sequelize.QueryTypes.SELECT
                            });


                            var userArray = [];
                            var now = Math.floor(Date.now() / 1000);

                            if (user !== null) {
                                for (var i = 0; i < user.length; i++) {
                                    /* verificar vip */
                                    if (user[i].rank == 2) {
                                        //check vip timestamp
                                        const timeVip = await db.query("SELECT vip_expire FROM players WHERE id = ?", {
                                            replacements: [user[i].id], type: sequelize.QueryTypes.SELECT
                                        });

                                        if (timeVip.length > 0) {
                                            var result_time = timeVip[0].vip_expire;
                                            const dt = new Date(result_time).getTime();
                                            var timestamp = dt / 1000;

                                            if (now >= timestamp) { //if time vip expired
                                                //desactive vip benefits
                                                await PlayerModel.update({
                                                    vip: 0,
                                                    rank: 1,
                                                }, {
                                                    where: { id: user[i].id }
                                                });
                                            }
                                        }
                                    }

                                    userArray.push({
                                        id: user[i].id,
                                        username: user[i].username,
                                        motto: user[i].motto,
                                        figure: user[i].figure,
                                        last_online: user[i].last_online,
                                        online: user[i].online == '1',
                                        email: user[i].email,
                                        diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
                                        credits: functions.formatCount(parseInt(user[i].credits), true),
                                        duckets: functions.formatCount(parseInt(user[i].activity_points), true),
                                        seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
                                        isVip: user[i].vip == '1' ? true : false,
                                        canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
                                    })
                                }

                                //add user ip in token for future security check
                                const token = generateToken({ id: player.id, ip: requestIp.getClientIp(req)})
                                return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });
                            }
                        }
                    } else {
                        if (config.get('cms_config').maintenance && player.rank <= config.get('cms_config').cms_config.maintenanceMinimumRankLogin) {
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: i18n.__('maintenance', { hotelName })
                            });
                        }

                        if (player.ip_last != requestIp.getClientIp(req)) {
                            const updateIp = await PlayerModel.update({
                                ip_last: requestIp.getClientIp(req)
                            }, {
                                where: { id: player.id }
                            });
                        };
                    }

                    const user = await db.query("SELECT id,username,motto,figure,last_online,online,email,rank,vip_points,credits,activity_points,seasonal_points,vip FROM players WHERE id = ?", {
                        replacements: [player.id], type: sequelize.QueryTypes.SELECT
                    });


                    var userArray = [];

                    if (user !== null) {

                        for (var i = 0; i < user.length; i++) {
                            if (user[i].rank == 2) {
                                //check vip timestamp
                                const timeVip = await db.query("SELECT vip_expire FROM players WHERE id = ?", {
                                    replacements: [user[i].id], type: sequelize.QueryTypes.SELECT
                                });

                                if (timeVip.length > 0) {
                                    var result_time = timeVip[0].vip_expire;
                                    const dt = new Date(result_time).getTime();
                                    var timestamp = dt / 1000;

                                    if (now >= timestamp) { //if time vip expired
                                        //desactive vip benefits
                                        await PlayerModel.update({
                                            vip: 0,
                                            rank: 1,
                                        }, {
                                            where: { id: user[i].id }
                                        });
                                    }
                                }
                            }
							userArray.push({
								id: user[i].id,
								username: user[i].username,
								motto: user[i].motto,
								figure: user[i].figure,
								last_online: user[i].last_online,
								online: user[i].online == '1',
								email: user[i].email,
								diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
								credits: functions.formatCount(parseInt(user[i].credits), true),
								duckets: functions.formatCount(parseInt(user[i].activity_points), true),
								seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
								isVip: user[i].vip == '1' ? true : false,
								canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
							})
                        }


						//add user ip in token for future security check
						const token = generateToken({ id: player.id, ip: requestIp.getClientIp(req)})
                        return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

	async look(req, res) {
		try {
			const { identification } = req.body;

			if (identification.length < 1 || identification.trim() === "") return;

			const player = await PlayerModel.findOne({ where: { username: identification } });

			if (player !== null) {
				return res.status(200).json({ status_code: 200, look: config.get('cms_config').avatarImage + "?figure=" + player.figure + "&head_direction=3&size=n&gesture=sml" });
			} else {
				return res.status(200).json({ status_code: 400 });
			}
		} catch (error) {
			return res.status(500).json({ error });
		}
	},
	
	async loginPin(req, res) {
        try {
            const { access_code } = req.body;

            var now = moment().unix();
            var compare = now - (60 * config.get('cms_config').loginSettings.doubleAuthenticationExpireMinutes);

            if (access_code) {

                const accessCode = await db.query("SELECT player_id, timestamp FROM cms_login_pin WHERE access_code = ? AND timestamp >= ? AND enabled = ? ORDER BY id DESC LIMIT 1", {
                    replacements: [parseInt(access_code), compare, '1'], type: sequelize.QueryTypes.SELECT
                });

                if (accessCode.length > 0) {

                    await LoginPin.update({
                        enabled: '0',
                        last_ip: requestIp.getClientIp(req),
                    }, {
                        where: { access_code: access_code }
                    })

                    await PlayerModel.update({
                        ip_last: requestIp.getClientIp(req)
                    }, {
                        where: { id: JSON.stringify(accessCode[0].player_id) }
                    })


                    const user = await db.query("SELECT id,username,motto,figure,last_online,online,email,rank,vip_points,credits,activity_points,seasonal_points FROM players WHERE id = ?", {
                        replacements: [JSON.stringify(accessCode[0].player_id)], type: sequelize.QueryTypes.SELECT
                    });

                    var userArray = [];

                    if (user !== null) {
                        for (var i = 0; i < user.length; i++) {
							userArray.push({
								id: user[i].id,
								username: user[i].username,
								motto: user[i].motto,
								figure: user[i].figure,
								last_online: user[i].last_online,
								online: user[i].online == '1',
								email: user[i].email,
								diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
								credits: functions.formatCount(parseInt(user[i].credits), true),
								duckets: functions.formatCount(parseInt(user[i].activity_points), true),
								seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
								isVip: user[i].vip == '1' ? true : false,
								canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
							});
                        }

                        //add user ip in token for future security check
                        const token = generateToken({ id: JSON.stringify(accessCode[0].player_id), ip: requestIp.getClientIp(req) })
                        return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });
                    }
                } else {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: 'Este código é inválido ou já expirou.'
                    });
                }
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Informe o código de confirmação.'
                });
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
	
    async recoverPassword(req, res) {
        try {
            const { email } = req.body;

            if (typeof email === undefined || email.trim() === "" || email === null) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Informe o e-mail que utilizou na conta.'
                });
            } else if (!functions.validateEmail(email)) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Informe um e-mail válido.'
                });
            } else {
                const player = await PlayerModel.findOne(
                    {
                        where: { email: email },
                        include: { association: 'getResetPasswordData' }
                    });

                if (player !== null) {
                    var lastTimestamp = await db.query("SELECT timestamp FROM cms_reset_password WHERE player_id = ? ORDER BY id DESC LIMIT 1", {
                        replacements: [player.id]
                    });

                    if (lastTimestamp.length > 0) {
                        let timestamp = lastTimestamp[0].timestamp;

                        if ((timestamp + (60 * 3)) > moment().unix()) {
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: 'Espere 3 minutos antes de solicitar um novo link de redefinição de senha.'
                            });
                        } else {
                            let hash = crypto.createHash('sha1').update(JSON.stringify(Math.floor((Math.random() * 10) + 1))).digest('hex');

                            const insertResetPassword = await ResetPassword.create({
                                player_id: player.id,
                                reset_key: hash,
                                reg_ip: requestIp.getClientIp(req),
                                timestamp: moment().unix(),
                                enabled: '1'
                            });

                            if (insertResetPassword) {
                                sendResetPasswordMail.sendEmail(player.email, 'Redefinição de Senha', player.username, config.get('cms_config').hotelName, config.get('cms_config').link + '/new-password/' + hash + '');

                                return res.status(200).json({
                                    status_code: 200,
                                    message: 'Se ' + email + ' for o e-mail utilizado na conta, um e-mail com um link de redefinição de senha acaba de ser enviado.',
                                });
                            } else {
                                return res.status(200).json({
                                    error: true,
                                    status_code: 400,
                                    message: 'Ocorreu um erro ao enviar o e-mail. Por favor contate um Staff.'
                                });
                            }
                        }
                    }
                } else {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: 'Ocorreu um erro ao enviar o e-mail. Por favor contate um Staff.'
                    });
                }
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    }	

}