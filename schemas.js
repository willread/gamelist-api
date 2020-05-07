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
    },
    startedPlayingAt: Date
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

ListGameSchema.method('updateSecondsPlayed', (function(cb) {
    const listGame = this;
    const game = this.game

    listGame.populate('list')

    Activity.aggregate([
        {
            $match: {
                action: 'log-time',
                user: listGame.list.user
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$meta.seconds'}
            }
        },
        { $project: { _id: 0, total: true } }
    ], function(err, aggregate) {
        console.log('result', err, aggregate);
        listGame.secondsPlayed = aggregate[0].total;
        listGame.save();

        cb();
    });
}));

const ListGame = mongoose.model('ListGame', ListGameSchema);

const ProfileSchema = mongoose.Schema({
    user: String,
    alias: {
        type: String,
        unique: true,
        required: false,
        minlength: [3, 'Must be at least 3 characters'],
        maxlength: [16, 'Must be less than 10 characters']
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
    foreignField: 'user',
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