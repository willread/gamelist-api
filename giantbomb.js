const fetch = require('isomorphic-unfetch');

const query = async (path, customParams = {}) => {
    const params = Object.assign({
        api_key: process.env.GIANTBOMB_API_KEY,
        format: 'json'
    }, customParams);
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `https://www.giantbomb.com/api/${path}?${queryString}`;
    const results = await (await fetch(url)).json();

    return results.results;
};

module.exports = { query };