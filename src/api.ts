import express from 'express';

const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
const app = express();
const port = process.env.PORT || 3000;

const config: any = {
  databaseURI: process.env.MONGODB_URI,
  // cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY,
  serverURL: process.env.PARSE_SERVER_URL,
  publicServerURL: process.env.PARSE_SERVER_URL,
  graphQLServerURL: 'http://localhost:3004/graphql',
};

const mountPath = process.env.PARSE_MOUNT || '/parse';
const parseServer = new ParseServer(config);

const parseGraphQLServer = new ParseGraphQLServer(
  parseServer,
  {
    graphQLPath: '/graphql',
    playgroundPath: '/playground',
  }
);

app.use(mountPath, parseServer.app);
parseGraphQLServer.applyGraphQL(app);
parseGraphQLServer.applyPlayground(app);

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
