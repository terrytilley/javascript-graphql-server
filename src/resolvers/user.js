export default {
  Query: {
    me: (_, __, { req, models }) => {
      if (!req.session.userId) return null;
      return models.User.findById(req.session.userId);
    },
  },
};
