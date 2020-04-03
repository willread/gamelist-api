const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const giantbomb = require('./giantbomb');
const auth = require('./auth');
const { Game, List, Profile } = require('./schemas');

// Configure router

var router = express.Router();

const getUserList = async req => {
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

router.get('/', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);
  const games = await Game.find(
    { list: new mongoose.Types.ObjectId(list._id) }
  );

  res.status(200).json({
    games
  });
});

// Get a list
// GET /list/:userid|:alias

router.get('/:id', async (req, res) => {
  let profile = await Profile.findOne({ alias: req.params.id });

  if (!profile) { // Try user _id
    profile = await Profile.findOne({ user: req.params.id });
  }

  if (profile) {
    try {
      const list = await List.find({ user: profile.user });
      const games = await Game.find(
        { list: list._id }
      );

      res.status(200).json({ list });
    } catch(e) {
      res.status(500).json({  message: 'An unexpected error occured' });
    }
  } else {
    res.status(404).json({ message: 'No such list found' });
  }
});

// Add a game to your list
// POST /list/games/:id

router.post('/games/:id', auth.checkJwt, async (req, res) => {
  const giantbombGame = await giantbomb.query(`game/${req.params.id}`);

  if (giantbombGame) {
    const list = await getUserList(req);
    const game = new Game({
      name: giantbombGame.name,
      platform: req.body.platform,
      images: {
        icon: giantbombGame.image.icon_url,
        original: giantbombGame.image.original_url,
        thumbnail: giantbombGame.image.thumb_url
      },
      genres: giantbombGame.genres.map(genre => genre.name),
      list: list._id,
      status: 'unplayed',
      secondsPlayed: 0
    });

    await game.save();

    res.status(200).json(game);
  } else {
    res.status(500).json({}); // TODO
  }
});

// Delete a game from your list
// DELETE /list/games/:id

router.delete('/games/:id', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);

  await Game.deleteOne({
    list: new mongoose.Types.ObjectId(list._id),
    _id: new mongoose.Types.ObjectId(req.params.id)
  })
  res.status(200).json({});
});

// Update a game
// PATCH /list/games/:id

router.patch('/games/:id/', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);

  await Game.findOneAndUpdate({
    list: new mongoose.Types.ObjectId(list._id),
    _id: new mongoose.Types.ObjectId(req.params.id)
  }, req.body);

  res.status(200).json({});
});

// Log time
// PUT /list/games/:id/time

router.put('/games/:id/time', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);
  const seconds = parseInt(req.body.seconds || 0);

  if (seconds > 0) {
    await Game.findOneAndUpdate({
      list: new mongoose.Types.ObjectId(list._id),
      _id: new mongoose.Types.ObjectId(req.params.id)
    }, {
      $inc: {
        secondsPlayed: seconds
      }
    });
  }

  res.status(200).json({});
});

module.exports = router;
