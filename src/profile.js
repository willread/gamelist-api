const express = require('express');
const mongoose = require('mongoose').set('debug', true);
const Sentencer = require('sentencer')

const auth = require('./auth');
const { Profile, ListGame } = require('./schemas');
const { logActivity } = require('./activity');

Sentencer.configure({
    actions: {
        number: function(min, max) {
            return Math.floor( Math.random() * (max - min) ) + min;
        }
    }
});

// Configure router

const router = express.Router();

// Get your profile
// GET /profile

const getProfile = async user => {
    try {
        return await Profile.findOneAndUpdate(
            { user },
            {
                $setOnInsert: {
                    user: user,
                    alias: Sentencer.make('{{ adjective }}{{ noun }}{{ number(10, 99) }}')
                }
            },
            {
                new: true,
                upsert: true
            }
        );
    } catch(e) {
          if (e.codeName === 'DuplicateKey' && e.keyPattern.alias) {
            return await getProfile(user); // DANGER: Recursive, mind the stack! But will it ever fail that many times? Never say never ;)
          } else {
              return { error: e }; // FIXME
          }
      }
};

router.get('/', auth.checkJwt, async (req, res) => {
    const profile = await getProfile(req.user.sub);

    if (profile) {
        res.status(200).json(profile);
    } else {
        res.status(400).json({
            message: 'An unexpected error occured'
        });
    }
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