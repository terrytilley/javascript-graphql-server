export default {
  Query: {
    me: (_, __, { user }) => user,
  },
};
