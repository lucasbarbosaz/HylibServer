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
    async validSignature(req, res) {
        try {
            const isValid = false;

            const { token } = req.body;
            const check = await db.query("SELECT valid FROM validation_plan WHERE token = ?", {
                replacements: [ token ], type: sequelize.QueryTypes.SELECT
            });

            for (var i = 0; i < check.length; i++) {
                console.log(!check[i].valid === '1')
                if (check[i].valid === '0') {
                    res.status(200).json({
                        error: true, 
                        status_code: 400, 
                        message: "Assinatura inválida"
                    });
                    //process.exit(1);
                }
            }

            return res.status(200).json("OK");
        } catch (error) {
            return res.status(200).json(error);
        }
    }
}