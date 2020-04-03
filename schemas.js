const mongoose = require('mongoose').set('debug', true);

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
    secondsPlayed: Number,
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

module.exports = {
    GameSchema,
    Game,
    ListSchema,
    List
}