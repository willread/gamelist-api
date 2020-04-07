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

module.exports = {
    logActivity,
    router
};
