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
const GroupMemberships = require('../database/models/GroupMemberships');

module.exports = {
    async getUserMe(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);
            const user = await PlayerModel.findAll({ where: { id: userId }, attributes: ['id', 'username', 'email', 'motto', 'rank', 'figure', 'last_online', 'online', 'vip_points', 'credits', 'activity_points', 'seasonal_points', 'vip'] });

            var userArray = [];
            if (user) {

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
                    })
                }

                return res.status(200).json({ status_code: 200, user: userArray[0] });
            }

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getRichestUsers(req, res) {
        try {

            let richestusers = [];


            const getCredits = await db.query("SELECT username,figure,credits FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY credits + 0 DESC LIMIT 1", {
                type: sequelize.QueryTypes.SELECT
            });

            const getDiamonds = await db.query("SELECT username,figure,vip_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY vip_points + 0 DESC LIMIT 1", {
                type: sequelize.QueryTypes.SELECT
            });

            const getDuckets = await db.query("SELECT username,figure,activity_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY activity_points + 0 DESC LIMIT 1", {
                type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < getCredits.length; i++) {
                richestusers.push({
                    username: getCredits[i].username,
                    figure: getCredits[i].figure,
                    amount: functions.formatCount(parseInt(getCredits[i].credits), true)
                });
            }

            for (var i = 0; i < getDiamonds.length; i++) {
                richestusers.push({
                    username: getDiamonds[i].username,
                    figure: getDiamonds[i].figure,
                    amount: functions.formatCount(parseInt(getDiamonds[i].vip_points), true)
                });
            }

            for (var i = 0; i < getDuckets.length; i++) {
                richestusers.push({
                    username: getDuckets[i].username,
                    figure: getDuckets[i].figure,
                    amount: functions.formatCount(parseInt(getDuckets[i].activity_points), true)
                });
            }


            res.status(200).json(richestusers);

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getFeaturedGroups(req, res) {
        try {
            let groups = [];

            const consultFeaturedGroups = await db.query("SELECT GROUP_CONCAT(group_id),group_id FROM group_memberships GROUP BY group_id HAVING COUNT(group_id) > 0 ORDER BY COUNT(group_id) DESC LIMIT 5", {
                type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < consultFeaturedGroups.length; i++) {
                const count = await db.query("SELECT COUNT(DISTINCT group_memberships.id) AS count FROM group_memberships WHERE group_id = ?", {
                    replacements: [consultFeaturedGroups[i].group_id], type: sequelize.QueryTypes.SELECT
                })

                for (var c = 0; c < count.length; c++) {
                    const consultFeaturedGroup = await db.query("SELECT * FROM groups WHERE id = ?", {
                        replacements: [consultFeaturedGroups[i].group_id], type: sequelize.QueryTypes.SELECT
                    });

                    for (var str = 0; str < consultFeaturedGroup.length; str++) {
                        groups.push({
                            badge: consultFeaturedGroup[str].badge,
                            name: consultFeaturedGroup[str].name,
                            membersCount: count[c]
                        });
                    }
                }
            }

            res.status(200).json(groups);


        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getArticlesMe(req, res) {
        try {
            var newArr = [];

            const news = await db.query("SELECT id,title,shortstory,image,date,author FROM cms_news ORDER BY date DESC LIMIT 5", {
                type: sequelize.QueryTypes.SELECT
            });

            if (news.length > 0) {
                const consultLastArticleSlide = await db.query("SELECT * FROM cms_news WHERE rascunho = ? ORDER BY date DESC LIMIT 3", {
                    replacements: ['0'], type: sequelize.QueryTypes.SELECT
                });

                for (var i = 0; i < consultLastArticleSlide.length; i++) {
                    newArr.push(consultLastArticleSlide[i]);
                }
            }

            res.status(200).json(newArr);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getSliderListNews(req, res) {
        try {
            var newArr = [];

            const news = await db.query("SELECT * FROM cms_news WHERE rascunho = ? ORDER BY date DESC LIMIT 3,5", {
                replacements: ['0'], type: sequelize.QueryTypes.SELECT
            });

            if (news.length > 0) {
                for (var i = 0; i < news.length; i++) {
                    newArr.push(news[i])
                }
            }

            res.status(200).json(newArr);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getUserIdFromTokenUrl(req, res) {
        try {
            const { token, sso } = req.query;

            const id = functions.getUserIdFromToken(token);

            const updateSSO = db.query("UPDATE players SET auth_ticket = ? WHERE id = ?", {
                replacements: [sso, id], type: sequelize.QueryTypes.UPDATE
            });


            return res.status(200).json({ id: id, authorized: id !== null ? true : false, sso });
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getOnlineFriends(req, res) {
        try {
            let array = [];
            const token = req.headers.authorization.split(' ')[1];
            const userId = functions.getUserIdFromToken(token);

            const query = await db.query("SELECT players.username FROM players INNER JOIN player_settings ON players.id=player_settings.player_id WHERE players.id IN (SELECT user_two_id FROM messenger_friendships WHERE user_one_id = ?) AND online = '1' AND player_settings.hide_online = '0' ORDER BY players.username", {
                replacements: [parseInt(userId)], type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < query.length; i++) {
                array.push(query[i]);
            }

            return res.status(200).json(array);

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getUsersOnline(req, res) {
        try {
            const count = await db.query("SELECT active_players FROM server_status LIMIT 1", {
                type: sequelize.QueryTypes.SELECT
            });

            let usersOnline = JSON.stringify(count[0].active_players);

            return res.status(200).json({ count: usersOnline });

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

	async getPhotos(req, res) {
        try {

            const { type } = req.query;

            if (type == "client") {
                var newArrPhotos = [];
                const getPhotos = await db.query("SELECT player_photos.id, player_photos.player_id, players.username AS player_username, player_photos.room_id, rooms.name AS room_name,  player_photos.photo,player_photos.timestamp FROM player_photos INNER JOIN players ON players.id = player_photos.player_id INNER JOIN rooms ON rooms.id = player_photos.room_id WHERE players.vip='1' ORDER BY player_photos.id DESC LIMIT 6", {
                    type: sequelize.QueryTypes.SELECT
                });

                for (var i = 0; i < getPhotos.length; i++) {

                    newArrPhotos.push({
                        username: getPhotos[i].player_username,
                        image: getPhotos[i].photo,
                    });
                }

                return res.status(200).json(newArrPhotos);
            } else if (type == "usergallery") {
                const { username } = req.query;

                if (username && username.length > 0) {
                    var newArrPhotos = [];

                    const getPhotos = await db.query("SELECT player_photos.id, player_photos.player_id, players.username AS player_username, players.figure AS player_look, player_photos.room_id, rooms.name AS room_name,  player_photos.photo,player_photos.timestamp FROM player_photos INNER JOIN players ON players.id = player_photos.player_id INNER JOIN rooms ON rooms.id = player_photos.room_id WHERE players.username = ? ORDER BY player_photos.id DESC LIMIT 100", {
                        type: sequelize.QueryTypes.SELECT, replacements: [username]
                    });

                    for (var i = 0; i < getPhotos.length; i++) {
                        newArrPhotos.push({
                            username: getPhotos[i].player_username,
							figure: getPhotos[i].player_look,
                            image: getPhotos[i].photo,
                            room_name: getPhotos[i].room_name,
							room_id: getPhotos[i].room_id,
							date: getPhotos[i].timestamp
                        })
                    }

                    return res.status(200).json(newArrPhotos);
                } else {
                    var newArrPhotos = [];

                    const getPhotos = await db.query("SELECT player_photos.id, player_photos.player_id, players.username AS player_username, players.figure AS player_look, player_photos.room_id, rooms.name AS room_name,  player_photos.photo,player_photos.timestamp FROM player_photos INNER JOIN players ON players.id = player_photos.player_id INNER JOIN rooms ON rooms.id = player_photos.room_id ORDER BY player_photos.id DESC LIMIT 100", {
                        type: sequelize.QueryTypes.SELECT
                    });

                    for (var i = 0; i < getPhotos.length; i++) {
                        newArrPhotos.push({
                            username: getPhotos[i].player_username,
							figure: getPhotos[i].player_look,
                            image: getPhotos[i].photo,
                            room_name: getPhotos[i].room_name,
							room_id: getPhotos[i].room_id,
							date: getPhotos[i].timestamp
                        })
                    }

                    return res.status(200).json(newArrPhotos);
                }
            }

        } catch (error) {
            return res.status(200).json(error);
        }
	}
}