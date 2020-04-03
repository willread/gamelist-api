const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');

const ProfileSchema = mongoose.Schema({
    user: String,
    alias: String
});

const Profile = mongoose.model('Profile', ProfileSchema);

// Configure router

var router = express.Router();

// Get your profile
// GET /profile

router.get('/', auth.checkJwt, async (req, res) => {
    const profile = await Profile.findOneAndUpdate(
        { user: req.user.sub },
        {
            $setOnInsert: {
                user: req.user.sub
            }
        },
        {
            new: true,
            upsert: true
        }
    );

    profile.alias = profile._id; // Default to mongo id, can be edited later
    await profile.save();

    res.status(200).json(profile);
});

// Update your profile
// PATCH /profile

router.patch('/', auth.checkJwt, async (req, res) => {
    const updates = req.body;

    // Blacklist some fields

    if (req.body.user) {
        delete req.body.user;
    }

    const profile = await Profile.findOneAndUpdate(
        { user: req.user.sub },
        updates
    );

    res.status(200).json(profile);
});

module.exports = router;