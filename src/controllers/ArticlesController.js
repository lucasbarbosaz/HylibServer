const sequelize = require('sequelize');
const auth = require('../config/auth.json');
const bcrypt = require('bcryptjs');
const config = require('config');
const db = require('../database');
const moment = require('moment');
const requestIp = require('request-ip');
const jwt = require('jsonwebtoken');
const functions = require('../modules/functions');
const i18n = require('../translation/i18n');

const FormArticleModal = require('../database/models/FormArticle');

module.exports = {

    async indexNews(req, res) {
        try {
            var newsArr = [];

            const getNews = await db.query("SELECT id,title,image,shortstory FROM cms_news WHERE rascunho != ? ORDER BY date DESC LIMIT 6", {
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
                    section: i18n.__('articlesSectionsToday'),
                    news: today
                });
            }

            if (yesterday.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsYesterday'),
                    news: yesterday
                });
            }

            if (thisweek.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsThisWeek'),
                    news: thisweek
                });
            }

            if (lastweek.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsLastWeek'),
                    news: lastweek
                });
            }

            if (thismonth.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsThisMont'),
                    news: thismonth
                });
            }

            if (lastmonth.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsLastMonth'),
                    news: lastmonth
                });
            }

            if (oldest.length > 0) {
                response.push({
                    section: i18n.__('articlesSectionsOldest'),
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
                        message: i18n.__('getNewsInvalidSize', { size: size })
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
                        message: i18n.__('getNewsInvalidId')
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
                            message: i18n.__('getNewsNotFound')
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

    async getUsersLikedFromNewsId(req, res) {
        try {
            const { id } = req.query;

            let usersLiked = [];

            const getUsersLiked = await db.query("SELECT players.username,players.figure FROM cms_post_reaction INNER JOIN players ON cms_post_reaction.user_id=players.id WHERE cms_post_reaction.post_id = ? AND cms_post_reaction.type = ? AND cms_post_reaction.state = ?", {
                replacements: [id, 'article', 'like'], type: sequelize.QueryTypes.SELECT
            })

            for (var i = 0; i < getUsersLiked.length; i++) {
                usersLiked.push(getUsersLiked[i]);
            }

            return res.status(200).json(usersLiked);
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
            const { id, likeUrl } = req.body;

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

                            if (likeUrl == true) {
                                if (consultArticleLiked[i].state == 'like') {
                                    await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                        replacements: ['like', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                    });

                                    success.push({
                                        response: "update",
                                        status_code: 201
                                    });
                                } else {
                                    await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                        replacements: ['like', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                    });

                                    success.push({
                                        response: "like",
                                        status_code: 200
                                    });
                                }
                            } else {
                                if (consultArticleLiked[i].state == 'like') {
                                    await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                        replacements: ['undefined', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                    });

                                    success.push({
                                        response: "update",
                                        status_code: 201
                                    });
                                } else {
                                    await db.query("UPDATE cms_post_reaction SET state = ? WHERE post_id = ? AND user_id = ? AND type = ?", {
                                        replacements: ['like', id, user.id, 'article'], type: sequelize.QueryTypes.UPDATE
                                    });

                                    success.push({
                                        response: "like",
                                        status_code: 200
                                    });
                                }
                            }

                        }
                    } else {
                        await db.query("INSERT INTO cms_post_reaction (type, post_id, user_id, state) VALUES (?,?,?,?)", {
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
                                        message: i18n.__('sendCommentWaiting')
                                    });
                                } else {
                                    if (typeof value == undefined || value === "" || value === null) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: i18n.__('sendCommentValueUndefined')
                                        });
                                    } else if (value.length > 100) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: i18n.__('sendCommentLengthMax')
                                        });
                                    } else if (filter.values(value) === true) {
                                        return res.status(200).json({
                                            error: true,
                                            status_code: 404,
                                            message: i18n.__('sendCommentFilter')
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
    },

    async sendForm(req, res) {
      

            var success = [];


            const { articleId, userId, participants, link, message } = req.body;
            const checkLimitForm = await FormArticleModal.findAndCountAll({ where: { article_id: articleId, user_id: userId } });

            if (!participants || !link) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('formParticipantsOrLinkRequired')
                });
            } else if (checkLimitForm.count >= 3) {
                return res.status(200).json({
                    error: true,
                    status_code: 400,
                    message: i18n.__('formCheckLimit')
                });
            } else {
                await FormArticleModal.create({ article_id: articleId, user_id: userId, usernames: participants, timestamp: moment().unix(), link: link, message: message })
                    .then(() => {
						return res.status(200).json({
							status_code: 200,
							message: i18n.__('formSendSuccess')
						});	
                    }).catch(() => {
                        return res.status(200).json({
                            error: true,
                            status_code: 400,
                            message: i18n.__('formErrorUnknow')
                        });
                    }).finally(() => {})
            }
         
    }

}
