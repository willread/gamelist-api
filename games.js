const express = require('express');
const giantbomb = require('./giantbomb');

// Configure router

const router = express.Router();

// Search for games

router.get('/', async (req, res) => {
    const query = req.query.query; // TODO: Sanitize query
    const results = await giantbomb.query('search', {
        resources: 'game',
        query,
        limit: 5,
        field_list: 'id,name,image,platforms'
    });
    res.status(200).json(results);
});

module.exports = router;
