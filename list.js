const express = require('express');
const mongoose = require('mongoose').set('debug', true);
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const giantbomb = require('./giantbomb');

const GameSchema = mongoose.Schema({
  list: mongoose.Schema.Types.ObjectId,
  name: String,
  images: Object, // FIXME,
  platform: {
    type: String,
    enum: giantbomb.platforms
  },
  genres: Array,
  timeLog: Array,
  status: {
    type: String,
    enum: ['playing', 'finished', 'stopped', 'unplayed']
  },
  dateFinished: Date,
  pricePaid: Number
});

const Game = mongoose.model('Game', GameSchema);

const ListSchema = mongoose.Schema({
  user: String
});

const List = mongoose.model('List', ListSchema);

// Configure router

var router = express.Router();

// Define middleware that validates incoming bearer tokens
// using JWKS from YOUR_DOMAIN

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  audience: process.env.AUTH0_API_IDENTIFIER,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`
});

const getList = async req => {
  return await List.findOneAndUpdate(
    { user: req.user.sub },
    {
      $setOnInsert: {
        user: req.user.sub
      }
    },
    {
      new: true,
      upsert: true
    }
  );
};

// Get your list
// GET /list

router.get('/', checkJwt, async (req, res) => {
  const list = await getList(req);
  const games = await Game.find(
    { list: new mongoose.Types.ObjectId(list._id) }
  );

  res.status(200).json({
    games
  });
});

// Add a game to your list
// POST /list/games/:id

router.post('/games/:id', checkJwt, async (req, res) => {
  const giantbombGame = await giantbomb.query(`game/${req.params.id}`);

  if (giantbombGame) {
    const list = await getList(req);
    const game = new Game({
      name: giantbombGame.name,
      platform: req.body.platform,
      images: {
        icon: giantbombGame.image.icon_url,
        original: giantbombGame.image.original_url,
        thumbnaim: giantbombGame.image.thumb_url
      },
      genres: giantbombGame.genres.map(genre => genre.name),
      list: list._id,
      status: 'unplayed'
    });

    await game.save();

    res.status(200).json(game);
  } else {
    res.status(500).json({}); // TODO
  }
});

// Delete a game from your list
// DELETE /list/games/:id

router.delete('/games/:id', checkJwt, async (req, res) => {
  const list = await getList(req);

  await Game.deleteOne({
    list: new mongoose.Types.ObjectId(list._id),
    _id: new mongoose.Types.ObjectId(req.params.id)
  })
  res.status(200).json({});
});

// Update a game

router.patch('/games/:id/', checkJwt, async (req, res) => {
  const list = await getList(req);

  await Game.findOneAndUpdate({
    list: new mongoose.Types.ObjectId(list._id),
    _id: new mongoose.Types.ObjectId(req.params.id)
  }, req.body);
});

module.exports = router;
