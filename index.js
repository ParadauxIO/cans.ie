import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fs from "fs";
import {logMiddleware} from "./middleware/log.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cans = ["guinness", "harp", "hophouse", "molson", "pratsky", "rockshore"]
const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging middleware
app.use(logMiddleware(logsDir));

app.get("/", (req, res) => {
    res.render("Index", { can: getRandomElement(cans)});
});

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log(`isbetterthandubl.in app listening on port ${PORT}`);
});

function getRandomElement(array) {
    if (!array || array.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}