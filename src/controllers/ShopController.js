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

module.exports = {
    async getPlansVIP(req, res) {
        try {
            let plansvip = [];

            const plans = await db.query("SELECT * FROM cms_shop WHERE page = ? AND active = ? ORDER BY id DESC", {
                replacements: [ 'vip', '1' ], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansvip.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    beneficios: plans[i].beneficios,
                    hex: plans[i].hex_div,
                    link: plans[i].link
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
                replacements: [ 'stars', '1' ], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
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
                replacements: [ 'diamonds', '1' ], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
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
                replacements: [ 'duckets', '1' ], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < plans.length; i++) {
                plansStars.push({
                    product_id: plans[i].product_id,
                    precos: plans[i].precos,
                    precos_pt: plans[i].precos_pt,
                    link: plans[i].link

                });
            }

            return res.status(200).json(plansStars);
        } catch (error) {
            return res.status(200).json(error);
        }
    },
}