const { Model, DataTypes } = require('sequelize');

class cms_reset_password extends Model {
    static init(sequelize) {
        super.init({
            player_id: DataTypes.INTEGER,
            reset_key: DataTypes.STRING,
            reg_ip: DataTypes.STRING,
            timestamp: DataTypes.INTEGER,
            enabled: DataTypes.ENUM('0', '1')
        }, {
            sequelize
        });
    }

    static associate(models) {
        this.belongsTo(models.players, { foreignKey: 'player_id', as: 'resetpassword' });
    }
}

module.exports = cms_reset_password;