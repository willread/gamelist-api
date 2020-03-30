const express = require('express');
const fetch = require('isomorphic-unfetch');
const ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose').set('debug', true);

// var authUtils = require('./authUtils');

const ListSchema = mongoose.Schema({
  user: String,
  // user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  games: Array
});
// ListSchema.index({name: '', description: ''})

const List = mongoose.model('List', ListSchema);

// Configure router

var router = express.Router();

// GET /list

const user = 'google-oauth2|101459134272835055552'; // FIXME

router.get('/', async (req, res) => {
  const doc = await List.findOneAndUpdate(
    { user },
    {
      $setOnInsert: {
        user: user.sub,
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

// PUT /list

router.put('/', async (req, res) => {
  List.updateOne({ user }, { $push: { games: req.body.game }});
  res.status(200).json({});
});

// DELETE /list

router.delete('/', async (req, res) => {
  await List.updateOne({ user }, { $pull: { games: { id: req.query.id } }});
  res.status(200).json({});
});

module.exports = router;
