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

  if (doc.ok) {
    res.status(200).json(doc.value);
  } else {
    res.status(500).json({error: ''});
  }
});

module.exports = router;
