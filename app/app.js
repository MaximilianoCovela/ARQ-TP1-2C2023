import express from 'express';
import { nanoid } from 'nanoid';
import axios from 'axios';

const app = express();

const id = nanoid();

app.use((req, res, next) => {
    res.setHeader('X-API-Id', id);
    next();
});

app.get('/spaceflight_news', async (req, res) => {
    const response = await axios.get("https://api.spaceflightnewsapi.net/v3/articles?_limit=5");
    
    let titles = [];
    response.data.forEach(element => {
        if (element.hasOwnProperty('title')) {
            titles.push(element.title);
        }
    });

    res.status(200).send(titles);
})

app.listen(3000, () => console.log("Escuchando en el puerto", 3000))