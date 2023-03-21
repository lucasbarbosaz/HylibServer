const { Model, DataTypes } = require('sequelize');

class cms_login_pin extends Model {
    static init(sequelize) {
        super.init({
            player_id: DataTypes.INTEGER,
            access_code: DataTypes.STRING,
            timestamp: DataTypes.INTEGER,
            reg_ip: DataTypes.STRING,
            last_ip: DataTypes.STRING,
            enabled: DataTypes.ENUM('0', '1'),
        }, {
            sequelize
        });
    }

    static associate(models) {
        this.belongsTo(models.players, { foreignKey: 'player_id', as: 'pin' });
    }
}

module.exports = cms_login_pin;