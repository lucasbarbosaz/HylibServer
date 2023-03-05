const sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const PlayerModel = require('../database/models/Player');


module.exports = {
    async getResetKey(req,res) {
        try {
            var array = [];
            const { resetKey } = req.body;

            if (resetKey === null || resetKey === '' || typeof resetKey === undefined) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Não encontramos nenhum registro com essa chave de autenticação.' 
                });
            } else {
                const sql = await db.query("SELECT cms_reset_password.id, cms_reset_password.player_id, players.username, cms_reset_password.enabled FROM cms_reset_password INNER JOIN players ON cms_reset_password.player_id=players.id WHERE reset_key = ? ORDER BY id DESC LIMIT 1", {
                    replacements: [ resetKey ], type: sequelize.QueryTypes.SELECT
                });

                var valido = sql.length > 0;

                if (valido) {
                    for (var i = 0; i < sql.length; i++) {
                        var valido = sql[i].enabled  === '1' ? true : false;

                        array.push({
                            status_code: 200,
                            player_id: sql[i].player_id,
                            username: sql[i].username
                        })
                    }
                }
            }

            return res.status(200).json(array[0]);
        } catch (error) {
            return res.status(200).json(error);
        }
    },

    async resetPassword(req,res) {
        try {
            const { resetKey, password, passwordRepeat } = req.body;

            if (resetKey === null || resetKey === '' || typeof resetKey === undefined) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'A chave de redefinição não foi informada.' 
                });
            } else if (password === null || password === '' || typeof password === undefined) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'É obrigatório que informe uma senha.' 
                });
            } else if (password.length < 6) {
                return res.status(200).json({
                    error: true, 
                    status_code: 400, 
                    message: 'Por segurança, a nova senha tem que conter no mínimo 6 caracteres.' 
                });
            } else {
                if (password == passwordRepeat) {
                    const getReset = await db.query("SELECT * FROM cms_reset_password WHERE reset_key = ?", {
                        replacements: [ resetKey ], type: sequelize.QueryTypes.SELECT
                    })

                    if (getReset.length > 0) {
                        if (getReset[0].enabled == 1) {
                            let timestamp = getReset[0].timestamp;
                            
                            if ((timestamp + (60 * 60 * 6)) < moment().unix()) {
                                return res.status(200).json({
                                    error: true, 
                                    status_code: 400, 
                                    message: 'Esta chave de redefinição expirou.' 
                                });
                            } else {
                                const finish = await db.query("UPDATE cms_reset_password SET enabled = '0', last_ip = ? WHERE reset_key = ?", {
                                    replacements: [ requestIp.getClientIp(req), resetKey ], type: sequelize.QueryTypes.UPDATE
                                });
   
                                /**************** ************************/
                                const hash = bcrypt.genSaltSync();
                                let passwordHashed = bcrypt.hashSync(password, hash);
    
                                const updatePlayer = await PlayerModel.update({
                                    password: passwordHashed
                                }, {
                                    where: { id: getReset[0].player_id }
                                })
    
                                return res.status(200).json({ 
                                    status_code: 200,
                                    message: 'Sua senha foi alterada com sucesso! Você será redirecionado...'
                                });
                            }
                        } else {
                            return res.status(200).json({
                                error: true, 
                                status_code: 400, 
                                message: 'Esta chave de redefinição expirou.' 
                            });
                        }
                    } else {
                        return res.status(200).json({
                            error: true, 
                            status_code: 400, 
                            message: 'Esta chave de redefinição expirou.' 
                        });
                    }
                } else {
                    return res.status(200).json({
                        error: true, 
                        status_code: 400, 
                        message: 'As novas senhas não são iguais.' 
                    });
                }

            }
        } catch (error) {
            return res.status(200).json(error);
        }
    }
}