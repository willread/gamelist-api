const express = require('express');
const mongoose = require('mongoose').set('debug', true);
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const giantbomb = require('./giantbomb');

const ListSchema = mongoose.Schema({
  user: String,
  // user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  games: Array
});
// ListSchema.index({name: '', description: ''})

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

// GET /list

router.get('/', checkJwt, async (req, res) => {
  const doc = await List.findOneAndUpdate(
    { user: req.user.sub },
    {
      $setOnInsert: {
        user: req.user.sub,
        games: []
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  res.status(200).json(doc);
});

// POST /list/add/:id

router.post('/games/:id', checkJwt, async (req, res) => {
  const game = await giantbomb.query(`game/${req.params.id}`);

  if (game) {
    await List.updateOne({ user: req.user.sub }, { $push: { games: game }});
    res.status(200).json({});
  } else {
    res.status(500).json({}); // TODO
  }
});

// DELETE /lists/:id

router.delete('/games/:id', checkJwt, async (req, res) => {
  const updatedList = await List.updateOne({ user: req.user.sub }, { $pull: { games: { id: parseInt(req.params.id) } }});
  res.status(200).json(updatedList);
});

module.exports = router;
