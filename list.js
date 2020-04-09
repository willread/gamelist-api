const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const giantbomb = require('./giantbomb');
const auth = require('./auth');
const { ListGame, Game, List, Profile } = require('./schemas');
const { logActivity } = require('./activity');

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
  const listGames = await ListGame.find(
    { list: list._id }
  )
    .populate('game');

  res.status(200).json({
    games: listGames,
    list
  });
});

// Get a list
// GET /list/:userid|:alias

router.get('/:id', async (req, res) => {
  let profile = await Profile.findOne({ alias: req.params.id });

  if (!profile) { // Try user _id
    profile = await Profile.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
  }

  if (profile) {
    try {
      const list = await List.findOne({ user: profile.user });
      const games = await ListGame.find(
        { list: list._id }
      )
        .populate('game');

      res.status(200).json({ games });
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
    });

    await game.save();

    const existingListGame = await ListGame.exists({
      list: list._id,
      game: game._id,
      platform: game.platform
    });

    if (!existingListGame) {
      const listGame = new ListGame({
        game: game._id,
        list: list._id,
        status: 'unplayed',
        secondsPlayed: 0
      });

      await listGame.save();

      logActivity(req.user.sub,  'add-game', {}, { game });

      res.status(200).json(listGame);
    } else {
      res.status(400).json({
        message: 'This game is already in your list'
      });
    }
  } else {
    res.status(500).json({}); // TODO
  }
});

// Delete a game from your list
// DELETE /list/games/:id

router.delete('/games/:id', auth.checkJwt, async (req, res) => {
  await ListGame.deleteOne({
    _id: new mongoose.Types.ObjectId(req.params.id)
  })
  res.status(200).json({});
});

// Update a game
// PATCH /list/games/:id

router.patch('/games/:id/', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);
  const listGame = await ListGame.findOneAndUpdate({
    list: new mongoose.Types.ObjectId(list._id),
    _id: new mongoose.Types.ObjectId(req.params.id)
  }, req.body)
    .populate('game');

  if (req.body.status) {
    logActivity(req.user.sub, 'update-status', { status: req.body.status }, { game: listGame.game });
  }

  res.status(200).json({});
});

// Log time
// PUT /list/games/:id/time

router.put('/games/:id/time', auth.checkJwt, async (req, res) => {
  const list = await getUserList(req);
  const seconds = parseInt(req.body.seconds || 0);

  if (seconds > 0) {
    const listGame = await ListGame.findOneAndUpdate({
      list: new mongoose.Types.ObjectId(list._id),
      _id: new mongoose.Types.ObjectId(req.params.id)
    }, {
      $inc: {
        secondsPlayed: seconds
      }
    })
      .populate('game');

    logActivity(req.user.sub,  'log-time', { seconds }, { game: listGame.game });
  }

  res.status(200).json({});
});

module.exports = { router };