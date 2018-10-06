import bcrypt from 'bcrypt';

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
  },
};
