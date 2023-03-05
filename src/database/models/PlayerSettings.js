const { Model, DataTypes } = require('sequelize');

class player_settings extends Model {
    static init(sequelize) {
        super.init({
            player_id: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },
            allow_friend_requests: DataTypes.ENUM('0', '1'),
            ignore_invites: DataTypes.ENUM('0', '1'),
            hide_last_online: DataTypes.ENUM('0', '1'),
            hide_online: DataTypes.ENUM('0', '1'),
            allow_mimic: DataTypes.ENUM('0', '1'),
            allow_follow: DataTypes.ENUM('0', '1'),
            allow_trade: DataTypes.ENUM('0', '1'),
            disable_whisper: DataTypes.ENUM('1', '0'),
            allow_sex: DataTypes.ENUM('0', '1'),
            mention_type: DataTypes.ENUM('ALL', 'FRIENDS', 'NONE'),
        }, {
            sequelize
        });
    }

    static associate(models) {
        this.belongsTo(models.players, { foreignKey: 'player_id', as: 'settings' });
    }
}

module.exports = player_settings;