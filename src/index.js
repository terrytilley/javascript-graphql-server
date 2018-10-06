import 'dotenv/config';
import path from 'path';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import RateLimit from 'express-rate-limit';
import RateLimitRedisStore from 'rate-limit-redis';
import { ApolloServer } from 'apollo-server-express';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import models from './models';
import redis from './redis';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, './resolvers'))
);

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());

app.use(
  new RateLimit({
    store: new RateLimitRedisStore({ client: redis }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    delayMs: 0,
  })
);

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    req,
    models,
  }),
});

server.applyMiddleware({ app });

models.sequelize.sync({ force: true }).then(() => {
  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    )
  );
});
