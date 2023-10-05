import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { decode } from 'metar-decoder';
import MetricGenerator from './metric_generator.js'
import { spaceflightNewsConfig, quoteConfig, metarConfig, multipleQuotesConfig } from './config.js';
import { createClient } from 'redis';

const app = express();
const id = nanoid();
const port = 3000
const STATUS_OK = 200;
const DEFAULT_STATUS_ERROR = 500;
const DEFAULT_ERROR_MESSAGE = "An error occurred while processing your request. Please try again later.";
const redisClient = createClient({url: 'redis://redis:6379'})
const metricGenerator = new MetricGenerator();
const isCacheEnabled = process.env.IsCacheEnabled === 'true';

if (isCacheEnabled){
    await redisClient.connect();
}

process.on('SIGTERM', async () =>  {
    await redisClient.quit();
});

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/ping', (req, res) => {
    res.status(STATUS_OK).send("Successful response");
})

app.get('/spaceflight_news', async (req, res) => {
    let titles;
    try{
        if (isCacheEnabled){
            const titlesString = await redisClient.get('space_news');
            if (titlesString !== null) {
                titles = JSON.parse(titlesString);
                res.status(STATUS_OK).send(titles);
                return;
            }
        }

        const externalApiStartTime = Date.now();
        const response = await axios.get(`${spaceflightNewsConfig.url}?_limit=${spaceflightNewsConfig.limit}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);
        const titles = response.data.map(({ title }) => title).filter(Boolean);
        res.status(STATUS_OK).send(titles);
        if (isCacheEnabled){
            await redisClient.set('space_news', JSON.stringify(titles), {
                EX: 5
            });
        }
    } catch (error){
        console.error(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
    }
})

app.get('/quote', async (req, res) => {
    try{
        if (isCacheEnabled){
            let quote = await redisClient.SPOP('quotes');
            if (quote !== null) {
                console.log(`quote ${quote}`);
                let quoteJson = JSON.parse(quote);
                console.log(`quote json ${quoteJson}`);
                var jsonResult = createQuoteJsonResult(quoteJson);
                res.status(STATUS_OK).send(jsonResult);
                console.log(jsonResult);
                return;
            }
        }

        let response;
        const externalApiStartTime = Date.now();
        if (isCacheEnabled){
            response = await axios.get(`${multipleQuotesConfig.url}?limit=10`);
            response.data.forEach(element => {
                console.log(element);
                redisClient.SADD('quotes', JSON.stringify(element));
            });
            response = await axios.get(`${quoteConfig.url}`);
        }

        response = await axios.get(`${quoteConfig.url}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);

        var jsonResult = createQuoteJsonResult(response.data);
        console.log(jsonResult);
        res.status(STATUS_OK).send(jsonResult);
    } catch (error){
        console.error(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
    }
})

app.get('/metar', async (req, res) => {
    try {
        const station = req.query.station;
        const parser = new XMLParser();
        if (isCacheEnabled){
            const aeropuerto_info = await redisClient.get(station);
            if (aeropuerto_info !== null) {
                res.status(STATUS_OK).send(`${aeropuerto_info}`);
                metricGenerator.responseTimeMetric(0, 0);
                return;
            }
        }
        
        const externalApiStartTime = Date.now();
        const response = await axios.get(`${metarConfig.url}&stationString=${station}`);
        const externalApiEndTime = Date.now();
        metricGenerator.responseTimeMetric(externalApiStartTime, externalApiEndTime);

        if (response.data == null){
            res.status(404).send(`METAR data not found for station ${station}`);
        } else{
            const parsed = parser.parse(response.data);
            const rawText = parsed.response.data.METAR[0].raw_text;
            decode(rawText);

            res.status(STATUS_OK).send(`${rawText}`);
            
            if (isCacheEnabled){
                await redisClient.set(station, rawText, {
                    EX: 15
                });
            }
        }            
    } catch (error) {
        console.log(error.message);
        res.status(error.response ? error.response.status : DEFAULT_STATUS_ERROR).send(error.response ? error.message : DEFAULT_ERROR_MESSAGE);
    }
})

app.listen(port, () => console.log("Listening on port", port))

/***************************
    AUXILIARY FUNCTIONS
***************************/

function createQuoteJsonResult(data) {
    var jsonResult = {};
    jsonResult["content"] = data.content;
    jsonResult["author"] = data.author;
    return jsonResult;
}