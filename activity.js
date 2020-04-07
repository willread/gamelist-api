const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');
const { Activity, Profile } = require('./schemas');

// Configure router

var router = express.Router();

const logActivity = (user, action, metaModel, meta) => {
    const activity = new Activity({
        user, action, metaModel, meta: meta._id
    });

    activity.save();
};

// Get latest activities
// GET /activity

router.get('/', async (req, res) => {
    const activities = await Activity.find()
        .sort({_id: -1})
        .limit(20)
        .populate('profile')
        .populate('meta');

    res.status(200).json({
      activities
    });
  });

// Get latest user activities
// GET /activity/user/:userid|:alias

router.get('/user/:id', async (req, res) => {
    let profile = await Profile.findOne({ alias: req.params.id });

    if (!profile) { // Try user _id
      profile = await Profile.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    }

    const activities = await Activity.find({ user: profile.user })
        .sort({_id: -1})
        .limit(20)
        .populate('profile')
        .populate('meta');

    res.status(200).json({ activities });
});

module.exports = {
    logActivity,
    router
};
