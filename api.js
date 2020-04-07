const express = require('express');
const bodyParser = require('body-parser');
const mongoSanitize = require('mongo-sanitize');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false
});

const app = express();

// Set up bodyParser and set a sane upper size limit

app.use(bodyParser.json({limit: '5mb'}));

// Allow cross-origin

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin); // Allow all origins
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PATCH, POST, PUT, DELETE');
  next();
});

// Protect against mongo query attacks

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  next();
});

// Initialize the app.

const db = mongoose.connection;
db.on('error', () => {
  process.exit(1);
});

db.once('open', () => {
  const server = app.listen(process.env.PORT || 8080, function () {
    const port = server.address().port;
    console.log('App now running on port', port);
  });
});

app.get('/', (req, res) => {
  res.end('');
});

// Import modules

app.use('/games', require('./games').router);
app.use('/list', require('./list').router);
app.use('/profile', require('./profile')).router;

// Handle authentication errors

app.use((err, req, res, next) => {
	if (err.name === 'UnauthorizedError') {
		res.status(401).json({ message: 'Unauthorized. Invalid token!' });
	} else {
    next();
  }
});