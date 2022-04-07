//BinanceApi.js// -- Created By Florian Lepage 04/07/2022

const needle = require("needle");


class BinanceApi{
    constructor(config) {
        this.config = config;
    }

    async currentCryptoData(symbol) {
        const endpointUrl = `https://api.binance.com/api/v1/ticker/24hr?symbol=${symbol}`;

        const res = await needle('get', endpointUrl);

        return res.body;
    }
}
module.exports = {
    BinanceApi
}