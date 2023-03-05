const sequelize = require('sequelize');
const auth = require('../config/auth.json');
const bcrypt = require('bcryptjs');
const PlayerModel = require('../database/models/Player');
const config = require('config');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const jwt = require('jsonwebtoken');
const functions = require('../modules/functions');


function generateToken(params = {}) {
    return jwt.sign(params, auth.jwt_secret_key);
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
                    message: 'Este nome de usuário não existe ou está vázio!'
                });
            } else if (typeof password === undefined || password.trim() === "" || password === null) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Usuário ou senha incorretos!'
                });
            } else if (!bcrypt.compareSync(password, player.password)) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Usuário ou senha incorretos!'
                });
            } else {
                const consultUserBan = await db.query("SELECT expire, reason FROM bans WHERE (data = ? OR data = ? OR data = ?)", {
                    replacements: [player.id, player.ip_reg, player.ip_last], type: sequelize.QueryTypes.SELECT
                });

                if (consultUserBan.length > 0) {
                    let time = moment().unix();
                    let timeBan = consultUserBan[0].expire;

                    if (timeBan == '0') {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: 'Sua conta foi banida permanentemente do Lella pelo motivo: ' + consultUserBan[0].reason + ''
                        });
                    } else if (time < timeBan) {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: 'Sua conta foi banida até: <b>' + moment.unix(consultUserBan[0].expire).format('YYYY-MM-DD HH:mm:ss') + '</b> pelo motivo: ' + consultUserBan[0].reason + ''
                        });
                    } else if (time > timeBan) {
                        const deleteUserBan = await db.query("DELETE FROM bans WHERE data = ?", {
                            replacements: [player.id], type: sequelize.QueryTypes.DELETE
                        });

                        if (config.get('cms_config').maintenance && player.rank <= config.get('cms_config').cms_config.maintenanceMinimumRankLogin) {
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: 'Ops, o ' + config.get('cms_config').hotelName + ' está em manutenção no momento.'
                            });
                        }

                        if (player.ip_last != requestIp.getClientIp(req)) {
                            const updateIp = await PlayerModel.update({
                                ip_last: requestIp.getClientIp(req)
                            }, {
                                where: { id: player.id }
                            });
                        }

                        const user = await db.query("SELECT id,username,motto,figure,last_online,online,rank,vip_points,credits,activity_points,seasonal_points,vip FROM players WHERE id = ?", {
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
                                    diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
                                    credits: functions.formatCount(parseInt(user[i].credits), true),
                                    duckets: functions.formatCount(parseInt(user[i].activity_points), true),
                                    seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
                                    isVip: user[i].vip == '1' ? true : false,
                                    canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
                                })
                            }

                            const token = generateToken({ id: player.id })
                            return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });
                        }
                    }
                } else {
                    if (config.get('cms_config').maintenance && player.rank <= config.get('cms_config').cms_config.maintenanceMinimumRankLogin) {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: 'Ops, o ' + config.get('cms_config').hotelName + ' está em manutenção no momento.'
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

                const user = await db.query("SELECT id,username,motto,figure,last_online,online,rank,vip_points,credits,activity_points,seasonal_points,vip FROM players WHERE id = ?", {
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
                            diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
                            credits: functions.formatCount(parseInt(user[i].credits), true),
                            duckets: functions.formatCount(parseInt(user[i].activity_points), true),
                            seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
                            isVip: user[i].vip == '1' ? true : false,
                            canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
                        })
                    }


                    const token = generateToken({ id: player.id })
                    return res.status(200).json({ status_code: 200, token: token, user: userArray[0] });
                }
            }
        } catch(error) {
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
}

}