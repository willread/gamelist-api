const express = require('express');
const mongoose = require('mongoose').set('debug', true);

const auth = require('./auth');
const { Profile, ListGame } = require('./schemas');
const { logActivity } = require('./activity');

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
                new: true,
                runValidators: true
            }
        );

        res.status(200).json(profile);
    } catch(e) {
        if (e.codeName === 'DuplicateKey' && e.keyPattern.alias) {
            res.status(400).json({
                errors: {
                    alias: 'This alias has already been used'
                }
            });
        } else if (e.name === 'ValidationError') {
            res.status(400).json({
                message: 'A validation error occured',
                errors: e.errors
            });
        } else {
            res.status(400).json({
                message: 'An unexpected error occured'
            });
        }
    }
});

module.exports = { router };