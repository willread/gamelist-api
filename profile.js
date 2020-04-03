const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');

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

// Configure router

const router = express.Router();

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

    try {
        const profile = await Profile.findOneAndUpdate(
            { user: req.user.sub },
            updates,
            {
                new: true
            }
        );

        res.status(200).json(profile);
    } catch(e) {
        if (e.codeName === 'DuplicateKey' && e.keyPattern.alias) {
            res.status(400).json({
                fields: {
                    alias: 'This alias has already been used'
                }
            });
        } else if (e.name === 'ValidationError') {

        } else {
            res.status(400).json({
                message: 'An unexpected error occured'
            });
        }
    }
});

module.exports = router;