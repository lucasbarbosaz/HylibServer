const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const Player = require('./models/Player');
const Register = require('./models/Register');
const Articles = require('./models/Articles');
const GroupMemberships = require('./models/GroupMemberships');
const PlayerSettings = require('./models/PlayerSettings');

const db = new Sequelize(dbConfig);

Player.init(db);
Register.init(db);
Articles.init(db);
GroupMemberships.init(db);
PlayerSettings.init(db);

Player.associate(db.models);

db.authenticate().then(() => {
    console.log("Connection has been established sucessfully.");
}).catch((error) => {
    console.log("Unable to connect to the database: ", error);
})

module.exports = db;
