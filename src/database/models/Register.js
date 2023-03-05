const { Model, DataTypes } = require('sequelize');

const bcrypt = require('bcryptjs');


//insert players register
class players extends Model {
    static init(sequelize) {
        super.init({
            username: DataTypes.STRING,
            figure: DataTypes.STRING,
            motto: DataTypes.STRING,
            credits: DataTypes.INTEGER,
            vip_points: DataTypes.INTEGER,
            activity_points: DataTypes.INTEGER,
            rank: DataTypes.INTEGER,
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            gender: DataTypes.ENUM('M', 'F'),
            reg_timestamp: DataTypes.INTEGER,
            reg_date: DataTypes.STRING,
            birthday: DataTypes.DATE,
            last_online: DataTypes.INTEGER,
            ip_last: DataTypes.STRING,
            ip_reg: DataTypes.STRING,
        }, {
            sequelize,
            hooks: {
                beforeCreate: (player) => {
                    const hash = bcrypt.genSaltSync();
                    player.password = bcrypt.hashSync(player.password, hash);
                },
            },
        });
    }
}

module.exports = players;