const { Model, DataTypes } = require('sequelize');

class group_memberships extends Model {
    static init(sequelize) {
        super.init({
            group_id: DataTypes.INTEGER,
            player_id: DataTypes.INTEGER,
            access_level: DataTypes.ENUM('owner','admin','member'),
            date_joined: DataTypes.INTEGER
        }, {
            sequelize
        });
    }
}

module.exports = group_memberships;