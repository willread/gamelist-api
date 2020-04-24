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

// Start playing a game
// PUT /profile/playing { game }

async function logTime(listGameId, seconds, user) {
    const listGame = await ListGame.findOneAndUpdate(
        { _id: listGameId },
        {
            $inc: {
                secondsPlayed: seconds
            }
        },
        { returnOriginal: false }
    );

    await listGame.populate('game');

    logActivity(user,  'log-time', { seconds }, { game: listGame.game });

    return listGame.secondsPlayed;
}

router.put('/playing', auth.checkJwt, async (req, res) => {
    try {
        const profile = await Profile.findOne(
            { user: req.user.sub }
        );

        // We never stopped playing the last game, log the time for that one before we update

        if (profile.playing && profile.playing.listGame) {
            const seconds = Math.floor(((new Date()).getTime() - profile.playing.startedAt.getTime()) / 1000);

            await logTime(profile.playing.listGame, seconds, req.user.sub);
        }

        profile.playing = {
            listGame: req.body.listGame,
            startedAt: new Date()
        };

        await profile.save();

        res.status(200).json(profile);
    } catch(e) {
        res.status(400).json({
            message: 'An unexpected error occured'
        });
    }
});

// Stop playing a game and log the time
// If the cancel flag is set, no time will be logged
// DELETE /playing { cancel?: boolean }

router.delete('/playing', auth.checkJwt, async (req, res) => {
    try {
        const profile = await Profile.findOne(
            { user: req.user.sub }
        );
        let secondsPlayed;

        if (!req.body.cancel) {
            if (profile.playing && profile.playing.listGame) {
                const seconds = Math.floor(((new Date()).getTime() - profile.playing.startedAt.getTime()) / 1000);

                secondsPlayed = await logTime(profile.playing.listGame, seconds, req.user.sub);
            }
        }

        profile.playing = {
            listGame: null,
            startedAt: null
        };

        await profile.save();

        res.status(200).json({
            secondsPlayed
        });
    } catch(e) {
        res.status(400).json({
            message: 'An unexpected error occured'
        });
    }
});

module.exports = { router };