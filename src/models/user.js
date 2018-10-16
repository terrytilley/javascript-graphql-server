import uuid from 'uuid/v4';
import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'user',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: {
          args: true,
          msg: 'Email must be unique',
        },
        validate: {
          isEmail: {
            args: true,
            msg: 'Invalid email',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        validate: {
          len: {
            args: [5, 100],
            msg: 'The password needs to be between 5 and 100 characters long',
          },
        },
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      hooks: {
        beforeCreate: async user => {
          const hashedPassword = await bcrypt.hash(user.password, 12);
          user.password = hashedPassword;
          user.id = uuid();
        },
      },
    }
  );

  return User;
};
