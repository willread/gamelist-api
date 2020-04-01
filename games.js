const express = require('express');
const giantbomb = require('./giantbomb');

// Configure router

const router = express.Router();

// Search for games

router.get('/', async (req, res) => {
    const query = req.query.query; // TODO: Sanitize query
    const results = (await giantbomb.query('search', {
        resources: 'game',
        query,
        limit: 5,
        field_list: 'id,name,image,platforms'
    }));
    const games = [];

    results.forEach(result => {
        if (result.platforms) {
            result.platforms.forEach(platform => {
                games.push({
                    id: result.id,
                    name: result.name,
                    images: {
                        icon: result.image.icon_url
                        original: result.image.original_url,
                        thumbnaim: result.image.thumb_url
                    },
                    platform: platform.abbreviation
                });
            });
        }
    });

    res.status(200).json(games);
});

module.exports = router;
