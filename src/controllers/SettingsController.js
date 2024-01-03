const sequelize = require('sequelize');
const auth = require('../config/auth.json');
const bcrypt = require('bcryptjs');
const PlayerModel = require('../database/models/Player');
const PlayerSettingsModel = require('../database/models/PlayerSettings');
const config = require('config');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const jwt = require('jsonwebtoken');
const functions = require('../modules/functions');
const sanitizeHtml = require('sanitize-html');


module.exports = {
    async updateUserSettings(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);

            const user = await functions.getUserFromId(userId);

            if (user.online != 1) {

                const { username, motto } = req.body;
                const { allow_mimic, allow_trade, allow_friend_requests, hide_online, hide_last_online } = req.body;
                const { allow_follow, disable_whisper, allow_sex, mention_type } = req.body;


                let allowMimic = allow_mimic ? '1' : '0';
                let allowTrade = allow_trade ? '1' : '0';
                let allowFriendRequests = allow_friend_requests ? '1' : '0';
                let ignoreInvites = allow_friend_requests ? '1' : '0';
                let hideOnline = hide_online ? '1' : '0';
                let hideLastOnline = hide_last_online ? '1' : '0';
                let allowFollow = allow_follow ? '1' : '0';
                let disableWhisper = disable_whisper ? '1' : '0';
                let allowSex = allow_sex ? '1' : '0';
                let mentionType = mention_type == 'ALL' || mention_type == 'FRIENDS' || mention_type == 'NONE' ? mention_type : 'FRIENDS';

                if (motto.length > 70) {
                    return res.status(200).json({
                        error: true, 
                        status_code: 400, 
                        message: 'A sua missão deve ter no máximo 70 caracteres.'
                    }); 
                }

                await PlayerModel.update({
                    username: username,
                    motto: motto,
                }, {
                    where: { id: userId }
                });

                await PlayerSettingsModel.update({
                    allow_mimic: allowMimic,
                    allow_trade: allowTrade,
                    allow_friend_requests: allowFriendRequests,
                    ignore_invites: ignoreInvites,
                    hide_online: hideOnline,
                    hide_last_online: hideLastOnline,
                    allow_follow: allowFollow,
                    disable_whisper: disableWhisper,
                    allow_sex: allowSex,
                    mention_type: mentionType
                }, { 
                    where: { player_id: userId }
                 });

                 return res.status(200).json({ status_code: 200 });

            } else {
                return res.status(200).json({error: true, status_code: 400, message: "Você não pode salvar as preferências enquanto estiver online." }); 
            }
        } catch (error) {
            return res.status(500).json({ error }); 
        }

    },

    async getUserSettings(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            
            const user = await PlayerModel.findByPk(userId, { 
                include: { association: 'getSettingsUser' }
            });


            let array = {
                username: user.username,
                motto: user.motto,
                online: user.online == '1',
                email: user.email,
                allow_friend_requests: user.getSettingsUser[0].allow_friend_requests == '1',
                hide_last_online: user.getSettingsUser[0].hide_last_online == '1',
                hide_online: user.getSettingsUser[0].hide_online == '1',
                allow_mimic: user.getSettingsUser[0].allow_mimic == '1',
                allow_follow: user.getSettingsUser[0].allow_follow == '1',
                allow_trade: user.getSettingsUser[0].allow_trade == '1',
                disable_whisper: user.getSettingsUser[0].disable_whisper == '1',
                allow_sex: user.getSettingsUser[0].allow_sex == '1',
                mention_type: user.getSettingsUser[0].mention_type,
            };
            
            return res.status(200).json(array);

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async updateUserEmail(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            const user = await functions.getUserFromId(userId);
            const { email } = req.body;

            let emailUser = functions.strtolower(email);

            if (email.length > 0) {
                if (emailUser !== user.email) {
                    if (functions.validateEmail(email)) {
                        await PlayerModel.update({
                            email: emailUser
                        }, {
                            where: { id: userId }
                        });
                    } else {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: 'Informe um e-mail válido.'
                        });
                    }
                }
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: 'Informe um e-mail.'
                });
            }

            return res.status(200).json({ status_code: 200 });

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async updateUserPassword(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            const user = await functions.getUserFromId(userId);

            const { old_password, new_password, new_password_repeat } = req.body;

            if (old_password) {
                if (new_password) {
                    if (new_password_repeat) {
                        if (new_password == new_password_repeat) {
                            if (bcrypt.compareSync(old_password, user.password)) {
                                if (new_password.length >= 6) {
                                    const hash = bcrypt.genSaltSync();
                                    let passwordHashed = bcrypt.hashSync(new_password, hash);

                                    await PlayerModel.update({
                                        password: passwordHashed
                                    }, {
                                        where: { id: userId }
                                    });

                                    return res.status(200).json({ status_code: 200 });
                                } else {
                                    return res.status(200).json({
                                        error: true,
                                        status_code: 400,
                                        message: "Sua nova senha deve ter no mínimo 6 caracteres."
                                    });
                                }
                            } else {
                                return res.status(200).json({
                                    error: true,
                                    status_code: 400,
                                    message: "A senha atual informada está errada."
                                });
                            }
                        } else {
                            return res.status(200).json({
                                error: true,
                                status_code: 400,
                                message: "As novas senhas não são iguais."
                            });
                        }
                    } else {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: "Por favor, repita sua nova senha."
                        });
                    }
                } else {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: "Informe sua nova senha."
                    });
                }
            } else {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: "Informe sua senha atual."
                });
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
	
	async getUserSocialMedia(req,res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            const user = await functions.getUserFromId(userId);

            var array = [];

            if (user) {
                const getSocialMediaLinks = await db.query("SELECT instagram_link, imgur_link, vsco_link, twitter_link, link_link FROM player_settings WHERE player_id = ?", {
                    replacements: [ userId ], type: sequelize.QueryTypes.SELECT
                });

                if (getSocialMediaLinks.length > 0) {
                    for (var i = 0; i < getSocialMediaLinks.length; i++) {
                        array.push({
                            instagram: getSocialMediaLinks[i].instagram_link,
                            imgur: getSocialMediaLinks[i].imgur_link,
                            vsco: getSocialMediaLinks[i].vsco_link,
                            twitter: getSocialMediaLinks[i].twitter_link,
                            link: getSocialMediaLinks[i].link_link,
                        });
                    }
                }

                return res.status(200).json(array);
            }
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
	
	async updateUserSocialMedia(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            const user = await functions.getUserFromId(userId);

            const { instagram, imgur, vsco, twitter, link } = req.body;

            if (user) {
                const instagramFiltred = sanitizeHtml(instagram);
                const imgurFiltred = sanitizeHtml(imgur);
                const vscoFiltred = sanitizeHtml(vsco);
                const twitterFiltred = sanitizeHtml(twitter);
                const linkFiltred = sanitizeHtml(link);

                const updateSocialMedia = await db.query("UPDATE player_settings SET instagram_link = ?, imgur_link = ?, vsco_link = ?, twitter_link = ?, link_link = ? WHERE player_id = ?", {
                    replacements: [ instagramFiltred, imgurFiltred, vscoFiltred, twitterFiltred, linkFiltred, userId ], type: sequelize.QueryTypes.UPDATE
                });
                
                return res.status(200).json({ status_code: 200, message: "Links alterados"});
            }

        } catch (error) {
            return res.status(500).json({ error });
        }
    }

}