import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { spaceflightNewsConfig } from './config.js';
import { quoteConfig } from './config.js';

import { XMLParser } from 'fast-xml-parser';
import { decode } from 'metar-decoder';

const app = express();
const id = nanoid();
const port = 3000

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/ping', (req, res) => {
    res.status(200).send("Respuesta exitosa");
})

app.get('/spaceflight_news', async (req, res) => {
    const response = await axios.get(`${spaceflightNewsConfig.url}?_limit=${spaceflightNewsConfig.limit}`);
    const titles = response.data.map(({ title }) => title).filter(Boolean);
    res.status(200).send(titles);
})

app.get('/quote', async (req, res) => {
    const response = await axios.get(`${quoteConfig.url}`)
    var jsonResult = CreateJsonResult(response);
    res.status(200).send(jsonResult);
})

app.get('/metar', async (req, res) => {
    const station = req.query.station;
    const parser = new XMLParser();
    const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${station}&hoursBeforeNow=1`);
    const parsed = parser.parse(response.data);

    if (parsed && parsed.response && parsed.response.data && parsed.response.data.METAR && parsed.response.data.METAR.raw_text) {
      const rawText = parsed.response.data.METAR.raw_text;

      decode(rawText);
      
      res.send(`${rawText}`);
    } else {
      res.status(404).send(`METAR data not found for station ${station}`);
    }
})

app.listen(port, () => console.log("Escuchando en el puerto", port))

/***************************
    FUNCIONES AUXILIARES
***************************/
function CreateJsonResult(response){
    var jsonResult = {};
    jsonResult["content"] = response.data.content;
    jsonResult["author"] = response.data.author
    return jsonResult;
}