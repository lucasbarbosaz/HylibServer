const { Model, DataTypes } = require('sequelize');

class cms_news extends Model {
    static init(sequelize) {
        super.init({
            title: DataTypes.STRING,
            image: DataTypes.TEXT,
            shortstory: DataTypes.STRING,
            longstory: DataTypes.TEXT,
            author: DataTypes.TEXT,
            date: DataTypes.INTEGER,
            rascunho: DataTypes.TINYINT,
        }, {
            sequelize
        })
    }
}

module.exports = cms_news;