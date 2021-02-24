import express from 'express';

const ParseServer = require('parse-server').ParseServer
const app = express();
const port = process.env.PORT || 3000;

const config: any = {
  databaseURI: process.env.MONGODB_URI,
  // cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY,
  serverURL: process.env.PARSE_SERVER_URL,
};

const mountPath = process.env.PARSE_MOUNT || '/parse';
const api = new ParseServer(config);

app.use(mountPath, api);

app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!');
});

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
