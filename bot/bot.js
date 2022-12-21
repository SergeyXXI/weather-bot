import { Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import dotenv from "dotenv"; dotenv.config(); //remove on prod
import { stage } from "./regionScene.js";
import { initialMW, requestMW } from "./mwares.js";

const bot = new Telegraf(process.env.BOT_TOKEN);
const session = new LocalSession(
    { database: "./bot/db.json", storage: LocalSession.storageFileAsync }
).middleware();

bot.use(session, stage.middleware(), initialMW, requestMW);

export default bot;