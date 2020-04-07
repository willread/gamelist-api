const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');
const { Activity, Profile } = require('./schemas');

// Configure router

var router = express.Router();

const logActivity = (user, action, meta, models) => {
    const params = {
        user, action, meta
    };

    if (models) {
        Object.keys(models).forEach(key => {
            params[key] = models[key];
        });
    }

    const activity = new Activity(params);

    activity.save();
};

// Get latest activities
// GET /activity

router.get('/', async (req, res) => {
    const activities = await Activity.find()
        .sort({_id: -1})
        .limit(20)
        .populate('profile')
        .populate('game');

    res.status(200).json({
      activities
    });
  });

// Get latest user activities
// GET /activity/user/:userid|:alias

router.get('/user/:id', async (req, res) => {
    try {
        let profile = await Profile.findOne({ alias: req.params.id });

        if (!profile) { // Try user _id
            profile = await Profile.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        }

        if (!profile) {
            res.status(404).json({ message: 'No such user' });
        } else {
            const activities = await Activity.find({ user: profile.user })
                .sort({_id: -1})
                .limit(20)
                .populate('profile')
                .populate('meta');

        res.status(200).json(activities);
        }
    } catch(e) {
        res.status(500).json({  message: 'An unexpected error occured' });
    }
});

module.exports = {
    logActivity,
    router
};
