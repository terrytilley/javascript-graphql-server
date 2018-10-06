import bcrypt from 'bcrypt';
import removeAllUserSessions from '../utils/removeAllUserSessions';

export default {
  Mutation: {
    async register(_, { email, password }, { models }) {
      await models.User.create({ email, password });
      return true;
    },
    async login(_, { email, password }, { req, models }) {
      const user = await models.User.findOne({ where: { email } });
      if (!user) return null;

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return null;

      req.session.userId = user.id;
      return user;
    },
    async logout(_, __, { req, redis }) {
      const { userId } = req.session;

      if (userId) {
        removeAllUserSessions(userId, redis);

        req.session.destroy(err => {
          if (err) {
            console.error(err);
          }
        });

        return true;
      }

      return false;
    },
  },
};
