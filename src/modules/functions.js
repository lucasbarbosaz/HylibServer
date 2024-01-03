const jwt = require('jsonwebtoken');
const auth = require('../config/auth.json');
const db = require('../database');
const sequelize = require('sequelize');
const PlayerModel = require('../database/models/Player');
const PlayerSettingsModel = require('../database/models/PlayerSettings');

const COUNT_ABBRS = [ '', 'K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y' ];

module.exports = {
    validName (username) {
        if (username.toString().length >= 2 && username.toString().length <= 20) {
            return true;
        }

        return false;
    },

    preg_match (str, regex) {
        if (str.match(regex)) {
            return true;
        } 

        return false;
    },

    strtolower (str) {
        return str.toLowerCase();
    },

    validateEmail (email) {
        return email.match(
          /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    },



    getUserIdFromToken(token) {
        return jwt.verify(token, auth.jwt_secret_key, (err, decoded) => {    
            return decoded.id;
        });
    },


    async getUserFromId(userId) {
        return await PlayerModel.findOne({ where: { id: userId } });
    },


    async userSettingsById(key, userId) {
         const stmt = await PlayerSettingsModel.findOne({ where: { player_id: userId }, attributes: [ key ] });

         return stmt !== null ? stmt[key] : null;
    },

					
    formatCount(count, withAbbr = false, decimals = 2) {
        const i     = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
        let result  = parseFloat((count / Math.pow(1000, i)).toFixed(decimals));
        if(withAbbr) {
            result += `${COUNT_ABBRS[i]}`; 
        }
        return result;
    },

    escapeHtml(text) {
        var map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
      }
} 