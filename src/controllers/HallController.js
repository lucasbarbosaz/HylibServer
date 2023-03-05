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

module.exports = {
    async credits(req, res) {
        try {

            let credits = [];

            const creditsSQL = await db.query("SELECT username,figure,credits FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY credits + 0 DESC LIMIT 10", {
                type: sequelize.QueryTypes.SELECT
            });

            if (creditsSQL.length > 0) {
                for (var i = 0; i < creditsSQL.length; i++) {
                    credits.push({
                        username: creditsSQL[i].username,
                        figure: creditsSQL[i].figure,
                        amount: functions.formatCount(parseInt(creditsSQL[i].credits), true)
                    });
                }
            }

            return res.status(200).json(credits);

        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async diamonds(req, res) {
        try {
            let diamonds = [];

            const diamondSQL = await db.query("SELECT username,figure,vip_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY vip_points + 0 DESC LIMIT 10", {
                type: sequelize.QueryTypes.SELECT
            })

            if (diamondSQL.length > 0) {
                for (var i = 0; i < diamondSQL.length; i++) {
                    diamonds.push({
                        username: diamondSQL[i].username,
                        figure: diamondSQL[i].figure,
                        amount: functions.formatCount(parseInt(diamondSQL[i].vip_points), true)
                    });
                }
            }

            return res.status(200).json(diamonds);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async duckets(req, res) {
        try {
            let duckets = [];

            const ducketSQL = await db.query("SELECT username,figure,activity_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY activity_points + 0 DESC LIMIT 10", {
                type: sequelize.QueryTypes.SELECT
            });

            if (ducketSQL.length > 0) {
                for (var i = 0; i < ducketSQL.length; i++) {
                    duckets.push({
                        username: ducketSQL[i].username,
                        figure: ducketSQL[i].figure,
                        amount: functions.formatCount(parseInt(ducketSQL[i].activity_points), true)
                    });
                }
            }

            return res.status(200).json(duckets);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async events(req, res) {
        try {
            let events = [];

            const eventSQL = await db.query("SELECT id,username,figure,event_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY event_points + 0 DESC LIMIT 5", {
                type: sequelize.QueryTypes.SELECT
            });

            if (eventSQL.length > 0) {
                for (var i = 0; i < eventSQL.length; i++) {
                    events.push({
                        username: eventSQL[i].username,
                        figure: eventSQL[i].figure,
                        amount: functions.formatCount(parseInt(eventSQL[i].event_points), true)
                    })
                }
            }

            return res.status(200).json(events);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async promotions(req, res) {
        try {
            let promotions = [];

            const promotionSQL = await db.query("SELECT id,username,figure,promo_points FROM players WHERE `rank` <= " + config.get('cms_config').hallMaximumRank + " ORDER BY promo_points + 0 DESC LIMIT 5", {
                type: sequelize.QueryTypes.SELECT
            });

            if (promotionSQL.length > 0) {
                for (var i = 0; i < promotionSQL.length; i++) {
                    promotions.push({
                        username: promotionSQL[i].username,
                        figure: promotionSQL[i].figure,
                        amount: functions.formatCount(parseInt(promotionSQL[i].promo_points), true)
                    })
                }
            }

            return res.status(200).json(promotions);
        } catch (error) {
            return res.status(500).json({ error });
        }
    }
}