import express from "express";
import 'dotenv/config'
import csvParser from 'csv-parser';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';


const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/sentiment/:category", (req, res) => {
    const category = req.params.category;
    const filePath = path.join(__dirname, "..", "python_work", "data", `news_${category}_predicted.csv`);


    console.log(`Looking for file: ${filePath}`);
    console.log(`Directory Exists? ${fs.existsSync(path.join(__dirname, "python_work", "data"))}`);
    console.log(`File Exists? ${fs.existsSync(filePath)}`);

    if (!fs.existsSync(filePath)) {
        console.error(`File NOT FOUND: ${filePath}`);
        return res.status(404).json({ error: "CSV file not found for the given category." });
    }

    let sentimentData = [];
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => sentimentData.push(row))
        .on("end", () => res.json(sentimentData))
        .on("error", (err) => res.status(500).json({ error: err.message }));
});


app.get("/api/sentiment/:category", (req, res) => {
    const category = req.params.category;
    const filePath = path.join(__dirname, "python_work/data", `news_${category}_predicted.csv`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "CSV file not found for the given category." });
    }

    let sentimentData = [];
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => sentimentData.push(row))
        .on("end", () => res.json(sentimentData))
        .on("error", (err) => res.status(500).json({ error: err.message }));
});

app.post("/api/analyze-sentiment", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ success: false, message: "Text is required for sentiment analysis" });
    }

    try {
        // TODO: Replace this with your actual sentiment analysis model logic
        const sentimentResult = "Neutral";
        res.json({ success: true, sentiment: sentimentResult });
    } catch (error) {
        res.status(500).json({ success: false, message: "Sentiment analysis failed", error: error.message });
    }
});

async function makeApiRequest(url) {
    try {
        const response = await axios.get(url);
        return {
            status: 200,
            success: true,
            message: "Successfully fetched data",
            data: response.data,
        };
    } catch (error) {
        console.error("API request error:", error.response ? error.response.data : error.message);
        return {
            status: 500,
            success: false,
            message: "Failed to fetch data from the API",
            error: error.response ? error.response.data : error.message,
        };
    }
}

app.get("/api/all-news", async (req, res) => {
    const url = `https://newsapi.org/v2/everything?q=world&pageSize=100&page=1&sortBy=popularity&apiKey=${process.env.API_KEY}`
    const result = await makeApiRequest(url);
    res.status(result.status).json(result);
});


app.get("/api/top-headlines", async (req, res) => {
    let category = req.query.category || "general";
    let url = `https://newsapi.org/v2/top-headlines?country=us&page=1&pageSize=100&category=${category}&apiKey=${process.env.API_KEY}`
    const result = await makeApiRequest(url);
    res.status(result.status).json(result);
});

app.get("/api/country/:iso", async (req, res) => {
    const country = req.params.iso;
    let url = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${process.env.API_KEY}`;
    const result = await makeApiRequest(url);
    res.status(result.status).json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
