import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { decode } from 'metar-decoder';
import MetricGenerator from './metric_generator.js'
import { spaceflightNewsConfig, quoteConfig, metarConfig } from './config.js';

const app = express();
const id = nanoid();
const port = 3000
const STATUS_OK = 200;
const DEFAULT_STATUS_ERROR = 500;
const DEFAULT_ERROR_MESSAGE = "An error occurred while processing your request. Please try again later.";
const metricGenerator = new MetricGenerator();
const isCacheEnabled = process.env['IsCacheEnabled'] === 'true';

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/ping', (req, res) => {
    res.status(STATUS_OK).send("Successful response");
})

app.get('/spaceflight_news', async (req, res) => {
    try {
        const externalApiStartTime = Date.now();
        const response = await axios.get(`${spaceflightNewsConfig.url}?_limit=${spaceflightNewsConfig.limit}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);
        const titles = response.data.map(({ title }) => title).filter(Boolean);
        res.status(STATUS_OK).send(titles);
    } catch (error) {
        console.error(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
    }
})

app.get('/quote', async (req, res) => {
    try {
        const externalApiStartTime = Date.now();
        const response = await axios.get(`${quoteConfig.url}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);
        var jsonResult = createQuoteJsonResult(response);
        res.status(STATUS_OK).send(jsonResult);
    } catch (error) {
        console.error(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
    }
})

app.get('/metar', async (req, res) => {
    const station = req.query.station;
    const parser = new XMLParser();
    try {
        const externalApiStartTime = Date.now();
        const response = await axios.get(`${metarConfig.url}&stationString=${station}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);
        const parsed = parser.parse(response.data);

        if (parsed && parsed.response && parsed.response.data && parsed.response.data.METAR && parsed.response.data.METAR.raw_text) {
            const rawText = parsed.response.data.METAR.raw_text;

            decode(rawText);

            res.status(STATUS_OK).send(`${rawText}`);
        } else {
            res.status(404).send(`METAR data not found for station ${station}`);
        }
    } catch (error) {
        console.error(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
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