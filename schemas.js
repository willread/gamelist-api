const mongoose = require('mongoose').set('debug', true);

const giantbomb = require('./giantbomb');

const GameSchema = mongoose.Schema({
    name: String,
    images: Object, // FIXME,
    platform: {
      type: String,
      enum: giantbomb.platforms
    },
    genres: Array
}, {
    timestamps: true
});

const Game = mongoose.model('Game', GameSchema);

const ListSchema = mongoose.Schema({
    user: String
}, {
    timestamps: true
});

const List = mongoose.model('List', ListSchema);

const ListGameSchema = mongoose.Schema({
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List'
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    physicalCopy: Boolean,
    digitalCopy: Boolean,
    secondsPlayed: Number,
    status: {
      type: String,
      enum: ['playing', 'finished', 'stopped', 'unplayed']
    }
}, {
    timestamps: true
});

const ListGame = mongoose.model('ListGame', ListGameSchema);

const ProfileSchema = mongoose.Schema({
    user: String,
    alias: {
        type: String,
        unique: true,
        required: false,
        minlength: [3, 'Must be at least 3 characters'],
        maxlength: [16, 'Must be less than 10 characters']
    },
    playing: {
        listGame: {
            type: String,
            ref: 'ListGame'
        },
        startedAt: Date
    }
}, {
    timestamps: true
});

const Profile = mongoose.model('Profile', ProfileSchema);

const ActivitySchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['log-time', 'update-status', 'add-game'],
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    meta: {
        type: Object
    }
}, {
    toJSON: {
        virtuals: true
    },
    timestamps: true
});

ActivitySchema.virtual('profile', {
    ref: 'Profile',
    localField: 'user',
    foreignField: '_id',
    justOne: true
});

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = {
    GameSchema,
    Game,
    ListSchema,
    List,
    ListGameSchema,
    ListGame,
    ProfileSchema,
    Profile,
    ActivitySchema,
    Activity
};