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
const ShopModel = require('../database/models/Shop');
const axios = require('axios');

module.exports = {
    async getPlansVIP(req, res) {
        try {
            let plansvip = [];

            const plans = await db.query("SELECT * FROM cms_shop WHERE page = ? AND active = ? ORDER BY id DESC", {
                replacements: ['vip', '1'], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansvip.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    beneficios: plans[i].beneficios,
                    hex: plans[i].hex_div,
                    link: plans[i].link,
                    type: plans[i].type,
                    preco_pix: plans[i].preco_pix
                });
            }

            return res.status(200).json(plansvip);
        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async getPlansStars(req, res) {
        try {
            let plansStars = [];

            const plans = await db.query("SELECT * FROM cms_shop WHERE page = ? AND active = ? ORDER BY id DESC", {
                replacements: ['stars', '1'], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
					type: plans[i].type,
                    link: plans[i].link
                });
            }

            return res.status(200).json(plansStars);
        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async getPlansDiamonds(req, res) {
        try {
            let plansStars = [];

            const plans = await db.query("SELECT * FROM cms_shop WHERE page = ? AND active = ? ORDER BY id DESC", {
                replacements: ['diamonds', '1'], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
                    type: plans[i].type,
                    link: plans[i].link
                });
            }

            return res.status(200).json(plansStars);
        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async getPlansDuckets(req, res) {
        try {
            let plansStars = [];

            const plans = await db.query("SELECT * FROM cms_shop WHERE page = ? AND active = ? ORDER BY id DESC", {
                replacements: ['duckets', '1'], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
                    type: plans[i].type,
                    link: plans[i].link

                });
            }

            return res.status(200).json(plansStars);
        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async insertPayment(req, res) {
        try {
            const { idPayment, userId, status, type } = req.body;

            const player = await functions.getUserFromId(parseInt(userId));

            if (player) {

                /*
                const hasPaymentPending = await db.query("SELECT * FROM habbinfo_payments WHERE user_id = ? and status = ?", {
                    replacements: [ player.id, "pending" ], type: sequelize.QueryTypes.SELECT
                });

                if (hasPaymentPending.length > 0) {
                    await db.query("UPDATE habbinfo_payments SET id_payment = ?, plan = ? WHERE user_id = ? and status = ?", {
                        replacements: [ idPayment, type, hasPaymentPending[0].user_id, hasPaymentPending[0].status ], type: sequelize.QueryTypes.UPDATE
                    });
                } else {
                    await db.query("INSERT INTO habbinfo_payments (id_payment, user_id, status, plan, timestamp) VALUES (?,?,?,?,?)", {
                        replacements: [idPayment, parseInt(userId), status, type, moment().unix()], type: sequelize.QueryTypes.INSERT
                    });
                }
*/

                await db.query("INSERT INTO habbinfo_payments (id_payment, user_id, status, plan, timestamp) VALUES (?,?,?,?,?)", {
                    replacements: [idPayment, parseInt(userId), status, type, moment().unix()], type: sequelize.QueryTypes.INSERT
                });

                return res.status(200).json({
                    error: false,
                    status_code: 200,
                    message: "OK!",
                });
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerNotFound')
                });
            }

        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async approvedPayment(req, res) {
        try {
            const { idPayment, type, userId } = req.body;

            const player = await functions.getUserFromId(parseInt(userId));

            if (player) {
                const verifyIfHasPaid = await db.query("SELECT user_id FROM payments_logs_rewards WHERE id_payment = ?", {
                    replacements: [parseInt(idPayment)], type: sequelize.QueryTypes.SELECT
                });

                if (verifyIfHasPaid.length > 0) {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: "As recompensas deste usuário já foram entregues."
                    });
                }
                const configVips = await db.query("SELECT * FROM cms_clubvip", {
                    type: sequelize.QueryTypes.SELECT
                });

                if (configVips.length > 0) {
                    switch (type.toLowerCase()) {
                        case "turquesa":
                            if (player.online <= 0) {
                                const expireVip = player.vip_expire;
                                const currentDate = moment();
                                const toTimestamp = moment(expireVip).unix();

                                if (expireVip != null && toTimestamp >= moment().unix()) {
                                    const date = moment(expireVip).format('YYYY-MM-DD');
                                    var time = moment(date).add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
                                } else {
                                    var time = currentDate.add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
                                }

                                const diamondsPoints = player.vip_points += configVips[0].one_month_diamonds_amount;
                                const activityPoints = player.activity_points += configVips[0].one_month_duckets_amount;
                                const achievementPoints = player.achievement_points += configVips[0].one_month_achievements_amount;

                                //SEND DATA
                                const sendPlanMonth = await db.query("UPDATE players SET achievement_points = ?, rank = ?, vip = ?, vip_expire = ?, vip_points = ?, activity_points = ? WHERE id = ?", {
                                    replacements: [achievementPoints, '2', '1', time, diamondsPoints, activityPoints, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const verifyBadge = await db.query("SELECT id FROM player_badges WHERE badge_code = ? AND player_id = ?", {
                                    replacements: ['VIPTURQ', parseInt(userId)],
                                    type: sequelize.QueryTypes.SELECT
                                });

                                if (verifyBadge.length > 0) {
                                    const sendBadge = await db.query("INSERT INTO player_badges (badge_code, player_id) VALUES (?,?)", {
                                        replacements: ['VIPTURQ', parseInt(userId)],
                                        type: sequelize.QueryTypes.INSERT
                                    });
                                }

                                const sendRare = await db.query("INSERT INTO items (user_id, room_id, base_item, extra_data, wall_pos) VALUES (?,?,?,?,?)", {
                                    replacements: [parseInt(userId), '0', '1656369701', '0', ' '],
                                    type: sequelize.QueryTypes.INSERT
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Turquesa", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                                return res.status(200).json({
                                    error: false,
                                    status_code: 200,
                                    message: "OK!",
                                });

                            } else {
                                axios.get(`https://habbinfo.info/core/index.php?typevip=turquesa&username=${player.username}`).then((response) => {
                                    if (response.status === 200) {
										
										const expireVip = player.vip_expire;
										const currentDate = moment();
										const toTimestamp = moment(expireVip).unix();

										if (expireVip != null && toTimestamp >= moment().unix()) {
											const date = moment(expireVip).format('YYYY-MM-DD');
											var time = moment(date).add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
										} else {
											var time = currentDate.add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
										}
										
										//SEND DATA
										const sendPlanMonth = db.query("UPDATE players SET rank = ?, vip = ?, vip_expire = ? WHERE id = ?", {
											replacements: ['2', '1', time, parseInt(userId)],
											type: sequelize.QueryTypes.UPDATE
										});
										
                                        //PAYMENTS LOGS
                                        const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                            replacements: ["approved", idPayment, parseInt(userId)],
                                            type: sequelize.QueryTypes.UPDATE
                                        });

                                        const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                            replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Turquesa VIP", moment().unix()], type: sequelize.QueryTypes.INSERT
                                        });

                                        return res.status(200).json({
                                            error: false,
                                            status_code: 200,
                                            message: "Enviado com sucesso!"
                                        });
                                    } else {
                                        throw new Error("Erro na solicitação");
                                    }
                                });
                            }
                            break;

                        case "rubi":
                            if (player.online <= 0) {
                                const expireVip = player.vip_expire;
                                const currentDate = moment();
                                const toTimestamp = moment(expireVip).unix();

                                if (expireVip != null && toTimestamp >= moment().unix()) {
                                    const date = moment(expireVip).format('YYYY-MM-DD');
                                    var time = moment(date).add(2, 'month').format('YYYY-MM-DD HH:mm:ss');
                                } else {
                                    var time = currentDate.add(2, 'month').format('YYYY-MM-DD HH:mm:ss');
                                }

                                const diamondsPoints = player.vip_points += configVips[0].two_month_diamonds_amount;
                                const activityPoints = player.activity_points += configVips[0].two_month_duckets_amount;
                                const achievementPoints = player.achievement_points += configVips[0].two_month_achievements_amount;

                                //SEND DATA
                                const sendPlanMonth = await db.query("UPDATE players SET achievement_points = ?, rank = ?, vip = ?, vip_expire = ?, vip_points = ?, activity_points = ? WHERE id = ?", {
                                    replacements: [achievementPoints, '2', '1', time, diamondsPoints, activityPoints, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const verifyBadge = await db.query("SELECT id FROM player_badges WHERE badge_code = ? AND player_id = ?", {
                                    replacements: ['VIPRUBI', parseInt(userId)],
                                    type: sequelize.QueryTypes.SELECT
                                });

                                if (verifyBadge.length > 0) {
                                    const sendBadge = await db.query("INSERT INTO player_badges (badge_code, player_id) VALUES (?,?)", {
                                        replacements: ['VIPRUBI', parseInt(userId)],
                                        type: sequelize.QueryTypes.INSERT
                                    });
                                }

                                const sendRare = await db.query("INSERT INTO items (user_id, room_id, base_item, extra_data, wall_pos) VALUES (?,?,?,?,?)", {
                                    replacements: [parseInt(userId), '0', '1656369703', '0', ' '],
                                    type: sequelize.QueryTypes.INSERT
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Rubi", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                                return res.status(200).json({
                                    error: false,
                                    status_code: 200,
                                    message: "OK!",
                                });
                            } else {
                                axios.get(`https://habbinfo.info/core/index.php?typevip=rubi&username=${player.username}`).then((response) => {
                                    if (response.status === 200) {
										
										const expireVip = player.vip_expire;
										const currentDate = moment();
										const toTimestamp = moment(expireVip).unix();

										if (expireVip != null && toTimestamp >= moment().unix()) {
											const date = moment(expireVip).format('YYYY-MM-DD');
											var time = moment(date).add(2, 'month').format('YYYY-MM-DD HH:mm:ss');
										} else {
											var time = currentDate.add(2, 'month').format('YYYY-MM-DD HH:mm:ss');
										}
										
										//SEND DATA
										const sendPlanMonth = db.query("UPDATE players SET rank = ?, vip = ?, vip_expire = ? WHERE id = ?", {
											replacements: ['2', '1', time, parseInt(userId)],
											type: sequelize.QueryTypes.UPDATE
										});
										
                                        //PAYMENTS LOGS
                                        const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                            replacements: ["approved", idPayment, parseInt(userId)],
                                            type: sequelize.QueryTypes.UPDATE
                                        });

                                        const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                            replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Rubi VIP", moment().unix()], type: sequelize.QueryTypes.INSERT
                                        });
										
										

                                        return res.status(200).json({
                                            error: false,
                                            status_code: 200,
                                            message: "Enviado com sucesso!"
                                        });
                                    } else {
                                        throw new Error("Erro na solicitação");
                                    }
                                });
                            }
                            break;

                        case "diamante":
                            if (player.online <= 0) {
                                const expireVip = player.vip_expire;
                                const currentDate = moment();
                                const toTimestamp = moment(expireVip).unix();

                                if (expireVip != null && toTimestamp >= moment().unix()) {
                                    const date = moment(expireVip).format('YYYY-MM-DD');
                                    var time = moment(date).add(3, 'month').format('YYYY-MM-DD HH:mm:ss');
                                } else {
                                    var time = currentDate.add(3, 'month').format('YYYY-MM-DD HH:mm:ss');
                                }

                                const diamondsPoints = player.vip_points += configVips[0].two_month_diamonds_amount;
                                const activityPoints = player.activity_points += configVips[0].two_month_duckets_amount;
                                const achievementPoints = player.achievement_points += configVips[0].two_month_achievements_amount;

                                //SEND DATA
                                const sendPlanMonth = await db.query("UPDATE players SET achievement_points = ?, rank = ?, vip = ?, vip_expire = ?, vip_points = ?, activity_points = ? WHERE id = ?", {
                                    replacements: [achievementPoints, '2', '1', time, diamondsPoints, activityPoints, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const verifyBadge = await db.query("SELECT id FROM player_badges WHERE badge_code = ? AND player_id = ?", {
                                    replacements: ['VIPDIAMANTE', parseInt(userId)],
                                    type: sequelize.QueryTypes.SELECT
                                });

                                if (verifyBadge.length > 0) {
                                    const sendBadge = await db.query("INSERT INTO player_badges (badge_code, player_id) VALUES (?,?)", {
                                        replacements: ['VIPDIAMANTE', parseInt(userId)],
                                        type: sequelize.QueryTypes.INSERT
                                    });
                                }

                                const sendRare = await db.query("INSERT INTO items (user_id, room_id, base_item, extra_data, wall_pos) VALUES (?,?,?,?,?)", {
                                    replacements: [parseInt(userId), '0', '1656369702', '0', ' '],
                                    type: sequelize.QueryTypes.INSERT
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Diamante", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                                return res.status(200).json({
                                    error: false,
                                    status_code: 200,
                                    message: "OK!",
                                });
                            } else {
                                axios.get(`https://habbinfo.info/core/index.php?typevip=diamante&username=${player.username}`).then((response) => {
                                    if (response.status === 200) {
										
										const expireVip = player.vip_expire;
										const currentDate = moment();
										const toTimestamp = moment(expireVip).unix();

										if (expireVip != null && toTimestamp >= moment().unix()) {
											const date = moment(expireVip).format('YYYY-MM-DD');
											var time = moment(date).add(3, 'month').format('YYYY-MM-DD HH:mm:ss');
										} else {
											var time = currentDate.add(3, 'month').format('YYYY-MM-DD HH:mm:ss');
										}
										
										//SEND DATA
										const sendPlanMonth = db.query("UPDATE players SET rank = ?, vip = ?, vip_expire = ? WHERE id = ?", {
											replacements: ['2', '1', time, parseInt(userId)],
											type: sequelize.QueryTypes.UPDATE
										});
								
                                        //PAYMENTS LOGS
                                        const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                            replacements: ["approved", idPayment, parseInt(userId)],
                                            type: sequelize.QueryTypes.UPDATE
                                        });

                                        const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                            replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano Diamante", moment().unix()], type: sequelize.QueryTypes.INSERT
                                        });

                                        return res.status(200).json({
                                            error: false,
                                            status_code: 200,
                                            message: "Enviado com sucesso!"
                                        });
                                    } else {
                                        throw new Error("Erro na solicitação");
                                    }
                                });
                            }
                            break;

                        case "diamond55":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=40000`)
                                    .then((response) => {
                                        if (response.status === 200) {

                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 40,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const diamondsPoints = player.vip_points += 40000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 40,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                                return res.status(200).json({
                                    error: false,
                                    status_code: 200,
                                    message: "Enviado com sucesso!"
                                });
                            }

                            break;
                        case "diamond40":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=25000`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 25,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {

                                const diamondsPoints = player.vip_points += 25000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 25,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                                return res.status(200).json({
                                    error: false,
                                    status_code: 200,
                                    message: "Enviado com sucesso!"
                                });
                            }

                            break;
                        case "diamond30":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=15000`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 15,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const diamondsPoints = player.vip_points += 15000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 15,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "diamond25":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=10000`)
                                    .then((response) => {
                                        if (response.status === 200) {

                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 10,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {

                                const diamondsPoints = player.vip_points += 10000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 10,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "diamond15":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=8000`)
                                    .then((response) => {
                                        if (response.status === 200) {

                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 8,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {

                                const diamondsPoints = player.vip_points += 8000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 8,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "diamond8":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=diamonds&quantity=4000`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 4,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {

                                const diamondsPoints = player.vip_points += 4000;
                                const updateCoins = await db.query("UPDATE players SET vip_points = ? WHERE id = ?", {
                                    replacements: [diamondsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Diamantes no valor 4,000", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "ducket50":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=500`)
                                    .then((response) => {
                                        if (response.status === 200) {

                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 500", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const ducketsPoints = player.activity_points += 500;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 500", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "ducket40":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=400`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 400", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const ducketsPoints = player.activity_points += 400;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 400", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                            }

                            break;
                        case "ducket30":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=300`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 300", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const ducketsPoints = player.activity_points += 300;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 300", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });

                            }

                            break;
                        case "ducket25":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=250`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 250", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const ducketsPoints = player.activity_points += 250;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 250", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "ducket15":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=150`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 150", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {

                                const ducketsPoints = player.activity_points += 150;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });
                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 150", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        case "ducket5":
                            if (player.online >= 0) {
                                axios.get(`https://habbinfo.info/core/index.php?payment=coins-payment&username=${player.username}&type=duckets&quantity=50`)
                                    .then((response) => {
                                        if (response.status === 200) {
                                            //PAYMENTS LOGS
                                            const saveStatusPayment = db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                                replacements: ["approved", idPayment, parseInt(userId)],
                                                type: sequelize.QueryTypes.UPDATE
                                            });

                                            const saveLogsRewards = db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                                replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 50", moment().unix()], type: sequelize.QueryTypes.INSERT
                                            });

                                            return res.status(200).json({
                                                error: false,
                                                status_code: 200,
                                                message: "Enviado com sucesso!"
                                            });
                                        } else {
                                            throw new Error("Erro na solicitação");
                                        }
                                    })
                                    .catch((error) => {
                                        // Manipule o erro da solicitação Axios
                                        console.error(error);
                                        return res.status(500).json({
                                            error: true,
                                            status_code: 500,
                                            message: "Erro na solicitação ao servidor"
                                        });
                                    });
                            } else {
                                const ducketsPoints = player.activity_points += 50;
                                const updateCoins = await db.query("UPDATE players SET activity_points = ? WHERE id = ?", {
                                    replacements: [ducketsPoints, player.id], type: sequelize.QueryTypes.UPDATE
                                });

                                //PAYMENTS LOGS
                                const saveStatusPayment = await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ? AND user_id = ?", {
                                    replacements: ["approved", idPayment, parseInt(userId)],
                                    type: sequelize.QueryTypes.UPDATE
                                });

                                const saveLogsRewards = await db.query("INSERT INTO payments_logs_rewards (id_payment, user_id, status, message, timestamp) VALUES (?,?,?,?,?)", {
                                    replacements: [idPayment, parseInt(userId), "true", "Recebeu as recompensas do plano da Loja Duckets no valor 50", moment().unix()], type: sequelize.QueryTypes.INSERT
                                });
                            }

                            break;
                        default:
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: "Tipo de VIP inválido"
                            });
                    }
                } else {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: i18n.__('playerNotFound')
                    });
                }

            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerNotFound')
                });
            }

        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async rejectedPayment(req, res) {
        try {
            const { idPayment, userId } = req.body;

            const player = await functions.getUserFromId(parseInt(userId));

            if (player) {
                await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ?", {
                    replacements: ['rejected', idPayment], type: sequelize.QueryTypes.UPDATE
                });

                return res.status(200).json({
                    error: false,
                    status_code: 200,
                    message: "OK!",
                });
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerNotFound')
                });
            }

        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async cancelledPayment(req, res) {
        try {
            const { idPayment, userId } = req.body;

            const player = await functions.getUserFromId(parseInt(userId));

            if (player) {
                await db.query("UPDATE habbinfo_payments SET status = ? WHERE id_payment = ?", {
                    replacements: ['cancelled', idPayment], type: sequelize.QueryTypes.UPDATE
                });

                return res.status(200).json({
                    error: false,
                    status_code: 200,
                    message: "OK!",
                });
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('playerNotFound')
                });
            }

        } catch (error) {
            return res.status(200).json(error);
        }
    }
}