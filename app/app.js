import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { decode } from 'metar-decoder';
import { spaceflightNewsConfig, quoteConfig, metarConfig } from './config.js';

const app = express();
const id = nanoid();
const port = 3000
const STATUS_OK = 200;

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/ping', (req, res) => {
    res.status(STATUS_OK).send("Successful response");
})

app.get('/spaceflight_news', async (req, res) => {
    const response = await axios.get(`${spaceflightNewsConfig.url}?_limit=${spaceflightNewsConfig.limit}`);

    if (response.data) {
        const titles = response.data.map(({ title }) => title).filter(Boolean);
        res.status(STATUS_OK).send(titles);
    } else {
        res.status(response.status).send(response.statusText);
    }
})

app.get('/quote', async (req, res) => {
    const response = await axios.get(`${quoteConfig.url}`);

    if (response.data) {
        var jsonResult = createQuoteJsonResult(response);
        res.status(STATUS_OK).send(jsonResult);
    } else {
        res.status(response.status).send(response.statusText);
    }
})

app.get('/metar', async (req, res) => {
    const station = req.query.station;
    const parser = new XMLParser();
    const response = await axios.get(`${metarConfig.url}&stationString=${station}`);
    const parsed = parser.parse(response.data);

    if (parsed && parsed.response && parsed.response.data && parsed.response.data.METAR && parsed.response.data.METAR.raw_text) {
        const rawText = parsed.response.data.METAR.raw_text;

        decode(rawText);

        res.status(STATUS_OK).send(`${rawText}`);
    } else {
        res.status(404).send(`METAR data not found for station ${station}`);
    }
})

app.listen(port, () => console.log("Listening on port", port))

/***************************
    AUXILIARY FUNCTIONS
***************************/
function createQuoteJsonResult(response) {
    var jsonResult = {};
    jsonResult["content"] = response.data.content;
    jsonResult["author"] = response.data.author
    return jsonResult;
}