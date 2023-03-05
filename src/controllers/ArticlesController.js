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

const ArticlesModel = require('../database/models/Articles');

module.exports = {

    async indexNews(req, res) {
        try {
            var newsArr = [];

            const getNews = await db.query("SELECT id,title,image,shortstory FROM cms_news WHERE rascunho != ? ORDER BY date DESC LIMIT 3", {
                replacements: ['1'], type: sequelize.QueryTypes.SELECT
            });


            for (var i = 0; i < getNews.length; i++) {
                newsArr.push(getNews[i]);
            }

            return res.status(200).json(newsArr);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getNewsIndex(req, res) {
        try {
            async function getToken() {
                if (req.headers.authorization) {
                    const token = req.headers.authorization.split(' ')[1];

                    if (token) {
                        return token;
                    }
                }
                return false;

            }

            const user = await getToken() !== false ? await functions.getUserFromId(functions.getUserIdFromToken(await getToken())) : null;

            const getArticles = await db.query("SELECT id,date,title,shortstory,rascunho,image FROM cms_news ORDER BY id DESC LIMIT 250", {
                type: sequelize.QueryTypes.SELECT
            });

            var articles = [];
            var today = [];
            var yesterday = [];
            var thisweek = [];
            var lastweek = [];
            var thismonth = [];
            var lastmonth = [];
            var oldest = [];

            for (var i = 0; i < getArticles.length; i++) {
                let date = parseInt(getArticles[i].date);

                articles.push({
                    id: parseInt(getArticles[i].id),
                    date: date,
                    title: getArticles[i].title,
                    shortstory: getArticles[i].shortstory,
                    image: getArticles[i].image,
                    rascunho: getArticles[i].rascunho == '1'
                });

                if (articles[i].rascunho === true && (user === null || user.rank < 7)) {
                    continue;
                }

                if (date >= moment().unix() - 86400 && date <= moment().unix()) {
                    today.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });

                    //yesterday
                } else if (date >= moment().unix() - 172800 && date <= moment().unix() - 86400) {
                    yesterday.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });

                    //this week
                } else if (date >= moment().unix() - 604800 && date <= moment().unix() - 172800) {
                    thisweek.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });

                    //last week
                } else if (date >= moment().unix() - 1209600 && date <= moment().unix() - 604800) {
                    lastweek.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });

                    //this month
                } else if (date >= moment().unix() - 2592000 && date <= moment().unix() - 1209600) {
                    thismonth.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });

                    //last month
                } else if (date >= moment().unix() - 5184000 && date <= moment().unix() - 2592000) {
                    lastmonth.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });
                } else {
                    oldest.push({
                        id: parseInt(getArticles[i].id),
                        date: date,
                        title: getArticles[i].title,
                        shortstory: getArticles[i].shortstory,
                        image: getArticles[i].image,
                        rascunho: getArticles[i].rascunho == '1'
                    });
                }
            }

            var response = [];
            if (today.length > 0) {
                response.push({
                    section: 'Hoje',
                    news: today
                });
            }

            if (yesterday.length > 0) {
                response.push({
                    section: 'Ontem',
                    news: yesterday
                });
            }

            if (thisweek.length > 0) {
                response.push({
                    section: 'Esta semana',
                    news: thisweek
                });
            }

            if (lastweek.length > 0) {
                response.push({
                    section: 'Semana passada',
                    news: lastweek
                });
            }

            if (thismonth.length > 0) {
                response.push({
                    section: 'Esse mês',
                    news: thismonth
                });
            }

            if (lastmonth.length > 0) {
                response.push({
                    section: 'Último mês',
                    news: lastmonth
                });
            }

            if (oldest.length > 0) {
                response.push({
                    section: 'Antigo',
                    news: oldest
                });
            }
            return res.status(200).json(response);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getNews(req, res) {
        try {
            const { size, order } = req.query;
            const { id } = req.query;

            var newArr = [];
            var newArrArticle = [];

            if (size && order) {
                if (!Number.isInteger(parseInt(size))) {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: 'O valor de \'size\' deve ser um número inteiro.'
                    });
                }

                const news = await db.query(`SELECT cms_news.id, cms_news.title, cms_news.image, cms_news.shortstory, players.username AS author, cms_news.date FROM cms_news INNER JOIN players ON players.id = cms_news.author WHERE cms_news.rascunho = 0  ORDER BY cms_news.id ${order} LIMIT ${size} `, {
                    raw: true, type: sequelize.QueryTypes.SELECT
                });


                for (var i = 0; i < news.length; i++) {
                    newArr.push(news[i]);
                }

                return res.status(200).json(newArr);

            };

            if (id) {
                if (!Number.isInteger(parseInt(id))) {
                    return res.status(200).json({
                        error: true,
                        status_code: 400,
                        message: 'Forneça um número de id válido.'
                    });
                } else {

                    async function getToken() {
                        if (req.headers.authorization) {
                            const token = req.headers.authorization.split(' ')[1];

                            if (token) {
                                return token;
                            }
                        }
                        return false;

                    }

                    const user = await getToken() !== false ? await functions.getUserFromId(functions.getUserIdFromToken(await getToken())) : null;
                    const currentNews = await db.query("SELECT cms_news.id, cms_news.title, cms_news.image, cms_news.shortstory, cms_news.longstory, cms_news.color_html, cms_news.use_badge, cms_news.badge_code, players.username, players.figure, cms_news.date, cms_news.rascunho,cms_news.use_badge,cms_news.badge_code,cms_news.limite_de_comentarios, cms_news.classificacao,cms_news.comments, cms_news.form AS has_form,cms_news.form_field_1_title, cms_news.form_field_2_title FROM cms_news INNER JOIN players ON players.id = cms_news.author WHERE cms_news.id = ?" + (user === null || user.rank < 7 ? " AND rascunho = '0'" : ''), {
                        replacements: [parseInt(id)], type: sequelize.QueryTypes.SELECT
                    });

                    if (!currentNews.length > 0) {
                        return res.status(200).json({
                            error: true,
                            status_code: 404,
                            message: 'Nenhuma notícia encontrada com o id informado.'
                        });
                    } else {

                        newArrArticle.push({
                            id: parseInt(id),
                            rascunho: currentNews[0].rascunho == '1',
                            limite_de_comentarios: parseInt(currentNews[0].limite_de_comentarios),
                            has_form: currentNews[0].has_form == '1',
                            badge_code: currentNews[0].badge_code,
                            image: currentNews[0].image,
                            longstory: currentNews[0].longstory,
                            shortstory: currentNews[0].shortstory,
                            title: currentNews[0].title,
                            username: currentNews[0].username,
                            classificacao: currentNews[0].classificacao,
                            date: currentNews[0].date,
                            figure: currentNews[0].figure,
                            hex: currentNews[0].color_html,
                            form_field_1_title: currentNews[0].form_field_1_title,
                            form_field_2_title: currentNews[0].form_field_2_title,
                            commentsEnabled: currentNews[0].comments == '1' ? true : false
                        });


                        return res.status(200).json(newArrArticle[0]);
                    }
                }
            }


        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getLikesFromNewsId(req, res) {
        try {
            const { id } = req.query;

            let likes = [];
            const getLikesFromComments = await db.query("SELECT COUNT(*) AS count FROM cms_post_reaction WHERE post_id = ? AND type = ? AND state != ?", {
                replacements: [id, 'article', 'undefined'], type: sequelize.QueryTypes.SELECT
            });

            if (getLikesFromComments.length > 0) {
                for (var i = 0; i < getLikesFromComments.length; i++) {
                    likes.push({
                        like: getLikesFromComments[i].count
                    });
                }
            }

            return res.status(200).json(likes[0]);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async sendLike(req, res) {
        try {
            const { id } = req.body;

            var success = [];

            async function getToken() {
                if (req.headers.authorization) {
                    const token = req.headers.authorization.split(' ')[1];

                    if (token) {
                        return token;
                    }
                }
                return false;

            }

            if (Number.isInteger(parseInt(id))) {
                const consultIfExistsArticle = await db.query("SELECT id FROM cms_news WHERE id = ?", {
                    replacements: [id], type: sequelize.QueryTypes.SELECT
                });

                if (consultIfExistsArticle.length > 0) {
                    const user = await getToken() !== false ? await functions.getUserFromId(functions.getUserIdFromToken(await getToken())) : null;

                    const consultArticleLiked = await db.query("SELECT * FROM cms_post_reaction WHERE user_id = ? AND post_id = ? AND type = ?", {
                        replacements: [user.id, id, 'article'], type: sequelize.QueryTypes.SELECT
                    });

                    if (consultArticleLiked.length > 0) {
                        for (var i = 0; i < consultArticleLiked.length; i++) {
                            if (consultArticleLiked[i].state == 'like') {
                                const updateReaction = await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                    replacements: ['undefined', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                });

                                success.push({
                                    response: "update",
                                    status_code: 201
                                });
                            } else {
                                const updateReaction = await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                    replacements: ['like', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                });

                                success.push({
                                    response: "like",
                                    status_code: 200
                                });
                            }
                        }
                    } else {
                        const sendReaction = await db.query("INSERT INTO cms_post_reaction (type, post_id, user_id, state) VALUES (?,?,?,?)", {
                            replacements: ['article', id, user.id, 'like'], type: sequelize.QueryTypes.UPDATE
                        });

                        success.push({
                            response: "like",
                            status_code: 200
                        });
                    }
                }
            }

            return res.status(200).json(success);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async getCommentsFromNewsId(req, res) {
        try {

            const { id } = req.query;

            let comments = [];

            const selectCommands = await db.query("SELECT id,value,author_id,timestamp FROM cms_post_comments WHERE post_id = ? AND type = ? ORDER BY timestamp DESC", {
                replacements: [id, 'article'], type: sequelize.QueryTypes.SELECT
            });

            if (selectCommands.length > 0) {
                for (var i = 0; i < selectCommands.length; i++) {
                    const getPlayerData = await db.query("SELECT id,username,figure FROM players WHERE id = ?", {
                        replacements: [selectCommands[i].author_id], type: sequelize.QueryTypes.SELECT
                    });

                    for (var c = 0; c < getPlayerData.length; c++) {
                        comments.push({
                            value: selectCommands[i].value,
                            username: getPlayerData[c].username,
                            figure: getPlayerData[c].figure,
                            timestamp: selectCommands[i].timestamp
                        })
                    }
                }
            }

            return res.status(200).json(comments);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    async sendComment(req, res) {
        try {
            const { id, value } = req.body;

            var success = [];
            var error = [];

            async function getToken() {
                if (req.headers.authorization) {
                    const token = req.headers.authorization.split(' ')[1];

                    if (token) {
                        return token;
                    }
                }
                return false;

            }

            if (Number.isInteger(parseInt(id))) {
                const consultIfExistsArticle = await db.query("SELECT id FROM cms_news WHERE id = ?", {
                    replacements: [id], type: sequelize.QueryTypes.SELECT
                });

                if (consultIfExistsArticle.length > 0) {
                    var filter = [];
                    const user = await getToken() !== false ? await functions.getUserFromId(functions.getUserIdFromToken(await getToken())) : null;

                    const getFilter = await db.query("SELECT * FROM wordfilter");

                    for (var i = 0; i < getFilter.length; i++) {
                        filter.push(getFilter[i]);
                    }

                    for (var i = 0; i < consultIfExistsArticle.length; i++) {
                        const consultLastCommentByMe = await db.query("SELECT id,timestamp FROM cms_post_comments WHERE type = ? AND post_id = ? AND author_id = ? ORDER BY timestamp DESC LIMIT 1", {
                            replacements: ['article', consultIfExistsArticle[i].id, user.id], type: sequelize.QueryTypes.SELECT
                        });

                        if (consultLastCommentByMe.length > 0) {
                            for (var c = 0; c < consultLastCommentByMe.length; c++) {
                                if (consultLastCommentByMe[i].timestamp >= moment().unix() - 600) {
                                    return res.status(200).json({
                                        error: true,
                                        status_code: 404,
                                        message: 'Você tem que esperar <b>10 minutos</b> para comentar novamente.'
                                    });
                                } else {
                                    if (typeof value == undefined || value === "" || value === null) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: 'Você precisa escrever algo para enviar o comentarário.'
                                        });
                                    } else if (value.length > 100) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: 'Seu comentário é grande demais.'
                                        });
                                    } else if (filter.values(value) === true) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: 'Hmm, parece que encontramos uma palavra na blacklist em seu comentário.'
                                        });
                                    } else {
                                        const insertComment = await db.query("INSERT INTO cms_post_comments (type, post_id, value, author_id, timestamp) VALUES (?,?,?,?,?)", {
                                            replacements: ['article', consultIfExistsArticle[i].id, value, user.id, Math.floor(Date.now() / 1000)], type: sequelize.QueryTypes.INSERT
                                        });

                                        const getLastCommentByMe = await db.query("SELECT id,value,timestamp FROM cms_post_comments WHERE type = ? AND post_id = ? AND author_id = ? ORDER BY timestamp DESC LIMIT 1", {
                                            replacements: ['article', consultIfExistsArticle[i].id, user.id], type: sequelize.QueryTypes.SELECT
                                        });

                                        for (var l = 0; l < getLastCommentByMe.length; l++) {
                                            success.push({
                                                commentId: getLastCommentByMe[i].id,
                                                figure: user.figure,
                                                comment: value,
                                                username: user.username,
                                                timestamp: getLastCommentByMe[i].timestamp
                                            })
                                        }
                                    }
                                }
                            }
                        } else {
                            const insertComment = await db.query("INSERT INTO cms_post_comments (type, post_id, value, author_id, timestamp) VALUES (?,?,?,?,?)", {
                                replacements: ['article', consultIfExistsArticle[i].id, value, user.id, Math.floor(Date.now() / 1000)], type: sequelize.QueryTypes.INSERT
                            });

                            const getLastCommentByMe = await db.query("SELECT id,value,timestamp FROM cms_post_comments WHERE type = ? AND post_id = ? AND author_id = ? ORDER BY timestamp DESC LIMIT 1", {
                                replacements: ['article', consultIfExistsArticle[i].id, user.id], type: sequelize.QueryTypes.SELECT
                            });

                            for (var l = 0; l < getLastCommentByMe.length; l++) {
                                success.push({
                                    commentId: getLastCommentByMe[i].id,
                                    figure: user.figure,
                                    comment: value,
                                    username: user.username,
                                    timestamp: getLastCommentByMe[i].timestamp
                                })
                            }
                        }

                    }
                }
            }

            return res.status(200).json(success);
        } catch (error) {
            return res.status(500).json({ error });
        }
    }

}
