require('dotenv').config();

module.exports = {
    dialect: process.env.DB_DRIVER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
    define: {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
    },
};