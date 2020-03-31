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
  }
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

// GET /list

router.get('/', checkJwt, async (req, res) => {
  const list = await getList(req);
  const games = await Game.find(
    { list: list._id }
  );

  list.games = games;

  res.status(200).json(list);
});

// POST /list/games/:id

router.post('/games/:id', checkJwt, async (req, res) => {
  const giantbombGame = await giantbomb.query(`game/${req.params.id}`);

  if (giantbombGame) {
    const list = await getList(req);
    const game = new Game({
      name: giantbombGame.name,
      platform: req.body.platform,
      images: {
        icon: giantbombGame.image.icon_url
      },
      list: list._id
    });

    await game.save();

    res.status(200).json({});
  } else {
    res.status(500).json({}); // TODO
  }
});

// DELETE /list/games/:id

router.delete('/games/:id', checkJwt, async (req, res) => {
  const updatedList = await List.updateOne({ user: req.user.sub }, { $pull: { games: { id: parseInt(req.params.id) } }});
  res.status(200).json(updatedList);
});

module.exports = router;
