const { Model, DataTypes } = require('sequelize');

class cms_clubvip extends Model {
    static init(sequelize) {
        super.init({
            one_month_diamonds_amount: DataTypes.INTEGER,
            one_month_duckets_amount: DataTypes.INTEGER,
            one_month_achievements_amount: DataTypes.INTEGER,
            two_month_diamonds_amount: DataTypes.INTEGER,
            two_month_duckets_amount: DataTypes.INTEGER,
            two_month_achievements_amount: DataTypes.INTEGER,
            three_month_diamonds_amount: DataTypes.INTEGER,
            three_month_duckets_amount: DataTypes.INTEGER,
            three_month_achievements_amount: DataTypes.INTEGER,
        }, {
            sequelize
        })
    }
}

module.exports = cms_clubvip;