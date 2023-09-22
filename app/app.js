import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { spaceflightNewsConfig } from './config.js';

const app = express();

const id = nanoid();

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/spaceflight_news', async (req, res) => {
    const response = await axios.get(`${spaceflightNewsConfig.url}?_limit=${spaceflightNewsConfig.limit}`);
    const titles = response.data.map(({ title }) => title).filter(Boolean);
    res.status(200).send(titles);
})

app.listen(3000, () => console.log("Escuchando en el puerto", 3000))