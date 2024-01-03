const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const Player = require('./models/Player');
const Register = require('./models/Register');
const Articles = require('./models/Articles');
const GroupMemberships = require('./models/GroupMemberships');
const PlayerSettings = require('./models/PlayerSettings');
const ResetPassword = require('./models/ResetPassword');
const CmsLoginPin = require('./models/CmsLoginPin');
const Shop = require('./models/Shop');

const db = new Sequelize(dbConfig);

Player.init(db);
Register.init(db);
CmsLoginPin.init(db);
Articles.init(db);
GroupMemberships.init(db);
PlayerSettings.init(db);
ResetPassword.init(db);
Player.associate(db.models);
Shop.init(db);

db.authenticate().then(() => {
    console.log("Connection has been established sucessfully.");
}).catch((error) => {
    console.log("Unable to connect to the database: ", error);
})

module.exports = db;