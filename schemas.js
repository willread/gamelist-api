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

const ProfileSchema = mongoose.Schema({
    user: String,
    alias: {
        type: String,
        unique: true,
        required: false,
        minlength: [3, 'Must be at least 3 characters'],
        maxlength: [16, 'Must be less than 10 characters']
    }
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
    meta: {
        type: mongoose.type.ObjectId,
        refPath: 'metaModel'
    },
    metaModel: {
        type: String,
        enum: ['Game']
    }
}, {
    toJSON: {
        virtuals: true
    }
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
    ProfileSchema,
    Profile,
    ActivitySchema,
    Activity
};