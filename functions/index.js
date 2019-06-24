require('dotenv').config();
const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');
const functions = require('firebase-functions');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const CourseSearch = require('./resolvers/CourseSearch');
const UserSearch = require('./resolvers/UserSearch');
const InstitutionSearch = require('./resolvers/InstitutionSearch');
const TestSearch = require('./resolvers/TestSearch');
const PanelSearch = require('./resolvers/PanelSearch');
const ResponseImageSearch = require('./resolvers/ResponseImageSearch');
const QuestionSearch = require('./resolvers/QuestionSearch');
const QuestionChoiceSearch = require('./resolvers/QuestionChoiceSearch');
const ChallengeSearch = require('./resolvers/ChallengeSearch');
const ChallengeMessageSearch = require('./resolvers/ChallengeMessageSearch');
const AnswerSearch = require('./resolvers/AnswerSearch');

const { directiveResolvers } = require("./directives");

const resolvers = {
  Query,
  Mutation,
  CourseSearch,
  UserSearch,
  InstitutionSearch,
  TestSearch,
  PanelSearch,
  QuestionSearch,
  QuestionChoiceSearch,
  ChallengeSearch,
  ChallengeMessageSearch,
  AnswerSearch,
  Node: {
    __resolveType() {
      return null;
    }
  }
};

const server = new GraphQLServer({
  typeDefs: './schema.graphql',
  resolvers,
  directiveResolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      typeDefs: 'generated/prisma.graphql',
      endpoint: 'https://qbe1-c802843c00.herokuapp.com/database/dev',
      secret: 'mysecret123',
      debug: true
    }),
  }),
});

const options = {
  cors: true
};

server.createHttpServer(options);
const express = server.express;

module.exports = {
  api: functions.https.onRequest(express),
};
