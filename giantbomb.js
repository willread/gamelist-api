const fetch = require('isomorphic-unfetch');

const platforms = ["AMI", "GB", "GBA", "GG", "GEN", "LYNX", "SMS", "SNES", "CPC", "APL2", "AST", "C64", "MSX", "SPEC", "MAC", "PSP", "PS2", "X360", "NES", "PS1", "GCN", "A800", "NEO", "3DO", "CDI", "JAG", "SCD", "VC20", "32X", "XBOX", "NGE", "PS3", "Wii", "DC", "A2GS", "CD32", "2600", "SAT", "N64", "CVIS", "TI99", "INTV", "DS", "TGCD", "WSC", "TG16", "GBC", "C128", "NGCD", "ODY2", "DRAG", "CBM", "TRS8", "ZOD", "WSW", "CHNF", "5200", "COCO", "7800", "IPOD", "ODYS", "PCFX", "VECT", "GCOM", "GIZ", "VBOY", "NGP", "NGPC", "VSML", "PIN", "ARC", "NUON", "XBGS", "WSHP", "PS3N", "LEAP", "MVIS", "FDS", "LACT", "AVIS", "PC", "X68K", "IPHN", "BS-X", "A2K1", "AQUA", "64DD", "PIPN", "RZON", "HSCN", "GWAV", "DSI", "HALC", "FMT", "PC88", "BBCM", "PLTO", "PC98", "X1", "FM7", "6001", "PSPN", "3DS", "PICO", "SGFX", "BAST", "IPAD", "ZBO", "ANDR", "WP", "ACRN", "LOOP", "PDIA", "MZ", "VITA", "RCA2", "XAVX", "GP32", "PMIN", "CASV", "SCV", "DUCK", "3DSE", "WiiU", "BROW", "SG1K", "CDTV", "PSNV", "DIDJ", "XONE", "PS4", "SVIS", "AMAX", "PV1K", "C16", "ACAN", "LIN", "VIS", "OUYA", "FIRE", "N3DS", "NSW", "HGM", "APTV", "SMC7", "COUP", "VMIV", "TF1", "TUT", "GMT", "MBEE", "VSOC", "ABC", "JCD", "ALXA", "ML1", "BNA", "STAD", "PS5", "OQST", "PLDT", "XSX", "EVER", "AMIC"];

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

module.exports = {
    query,
    platforms
};