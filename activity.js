const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');
const { Activity } = require('./schemas');

// Configure router

var router = express.Router();

const logActivity = (user, action, metadata) => {
    const activity = new Activity({
        user, action, metadata
    });

    activity.save();
};

// Get latest activities
// GET /

router.get('/', async (req, res) => {
    const activities = await Activity.find()
        .sort({_id: -1})
        .limit(20);

    res.status(200).json({
      activities
    });
  });

module.exports = {
    logActivity,
    router
};
