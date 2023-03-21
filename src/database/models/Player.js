const { Model, DataTypes } = require('sequelize');

class players extends Model {
    static init(sequelize) {
        super.init({
            username: DataTypes.STRING,
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            motto: DataTypes.STRING,
            figure: DataTypes.STRING,
            last_online: DataTypes.INTEGER,
            rank: DataTypes.INTEGER,
            online: DataTypes.ENUM('0','1','2'),
            vip_points: DataTypes.INTEGER,
            credits: DataTypes.INTEGER,
            activity_points: DataTypes.INTEGER,
            seasonal_points: DataTypes.INTEGER,
            name_colour: DataTypes.STRING,
            birthday: DataTypes.DATE,
            cms_video: DataTypes.STRING,
            enable_radio: DataTypes.ENUM('0', '1'),
            oculto: DataTypes.ENUM('0', '1'),
            vip: DataTypes.ENUM('0', '1', '2'),
            reg_timestamp: DataTypes.INTEGER,
            ip_reg: DataTypes.STRING,
            ip_last: DataTypes.STRING,
            auth_ticket: DataTypes.STRING,
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.hasMany(models.player_settings, { foreignKey: 'player_id', as: 'getSettingsUser' });
        this.hasMany(models.cms_reset_password, { foreignKey: 'player_id', as: 'getResetPasswordData' });
        this.hasMany(models.cms_login_pin, { foreignKey: 'player_id', as: 'getPins' });
    } 
}

module.exports = players;