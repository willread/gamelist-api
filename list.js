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
    let game = await Game.findOne({
      name: giantbombGame.name,
      platform: req.body.platform
    });

    if (!game) {
      game = new Game({
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
    }

    const listGameExists = await ListGame.exists({
      list: list._id,
      game: game._id
    });

    if (!listGameExists) {
      let listGame = new ListGame({
        game: game._id,
        list: list._id,
        status: 'unplayed',
        secondsPlayed: 0
      });

      await listGame.save();
      listGame.game = game;

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

// Start playing a game
// PUT /list/games/:id/playing

async function logTime(listGameId, seconds, startedPlayingAt, user) {
  const listGame = await ListGame.findOne({ _id: listGameId });

  await listGame.populate('game');
  await logActivity(user,  'log-time', { seconds, startedPlayingAt }, {game: listGame.game });
  await listGame.updateSecondsPlayed()
}

router.put('/games/:id/playing', auth.checkJwt, async (req, res) => {
  try {
    const list = await getUserList(req);

    await ListGame.findOneAndUpdate({
      list: new mongoose.Types.ObjectId(list._id),
      _id: new mongoose.Types.ObjectId(req.params.id)
    }, {
      startedPlayingAt: new Date()
    });

    res.status(200).json({});
  } catch(e) {
      res.status(400).json({
          message: 'An unexpected error occured'
      });
  }
});

// Stop playing a game and log the time
// If the cancel flag is set, no time will be logged
// DELETE /list/games/:id/playing?[cancel=true]

router.delete('/games/:id/playing', auth.checkJwt, async (req, res) => {
  try {
    const list = await getUserList(req);
    const listGame = await ListGame.findOne({
      list: new mongoose.Types.ObjectId(list._id),
      _id: new mongoose.Types.ObjectId(req.params.id)
    });
    let secondsPlayed;

    if (!req.query.cancel) {
      if (listGame.startedPlayingAt) {
        const seconds = Math.floor(((new Date()).getTime() - listGame.startedPlayingAt.getTime()) / 1000);

        secondsPlayed = await logTime(listGame, seconds, listGame.startedPlayingAt, req.user.sub);
      }
    }

    listGame.startedPlayingAt = null;
    await listGame.save();

    res.status(200).json({
        secondsPlayed
    });
  } catch(e) {
      res.status(400).json({
          message: 'An unexpected error occured',
          error: e.message
      });
  }
});

module.exports = { router };