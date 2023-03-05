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
            const user = await PlayerModel.findAll({ where: { id: userId }, attributes: [ 'id', 'username', 'email', 'motto', 'rank', 'figure', 'last_online', 'online', 'vip_points', 'credits', 'activity_points', 'seasonal_points', 'vip' ] });

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
                        diamonds: functions.formatCount(parseInt(user[i].vip_points), true),
                        credits: functions.formatCount(parseInt(user[i].credits), true),
                        duckets: functions.formatCount(parseInt(user[i].activity_points), true),
                        seasonal: functions.formatCount(parseInt(user[i].seasonal_points), true),
                        isVip: user[i].vip == '1' ? true : false,
                        canOpenAdminpan: user[i].rank >= config.get('cms_config').staffCheckHkMinimumRank ? true : false,
                    })
                }

                return res.status(200).json({status_code: 200, user: userArray[0]});
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
                    replacements: [ consultFeaturedGroups[i].group_id ], type: sequelize.QueryTypes.SELECT
                })

                for (var c = 0; c < count.length; c++) {
                    const consultFeaturedGroup = await db.query("SELECT * FROM groups WHERE id = ?", {
                        replacements: [ consultFeaturedGroups[i].group_id ], type: sequelize.QueryTypes.SELECT
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
                    replacements: [ '0' ], type: sequelize.QueryTypes.SELECT
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
                replacements: [ '0' ], type: sequelize.QueryTypes.SELECT
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
                replacements: [ sso, id ], type: sequelize.QueryTypes.UPDATE
            });


            return res.status(200).json({id: id, authorized: id !== null ? true : false, sso});
        } catch (error) {
            return res.status(500).json({ error }); 
        }
    },

    async getEvents(req, res) {
        try {
            let events = [];

            const getEvent = await db.query("SELECT title,description,link,image FROM cms_events WHERE type = ? ORDER BY id DESC LIMIT 1", {
                replacements: [ 'evento' ], type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < getEvent.length; i++) {
                events.push({
                    title: getEvent[i].title,
                    description: getEvent[i].description,
                    image: getEvent[i].image
                });
            }

            return res.status(200).json(events);
        } catch (error) {
            return res.status(500).json({ error }); 
        }
    },

    async getActivity(req, res) {
        try {
            let activitys = [];

            const activity = await db.query("SELECT title,description,link,image FROM cms_events WHERE type = ? ORDER BY id DESC LIMIT 1", {
                replacements: [ 'atividade' ], type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < activity.length; i++) {
                activitys.push({
                    title: activity[i].title,
                    description: activity[i].description,
                    image: activity[i].image
                });
            }

            return res.status(200).json(activitys);
        } catch (error) {
            return res.status(500).json({ error }); 
        }
    },
}