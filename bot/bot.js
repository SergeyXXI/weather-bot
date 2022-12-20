import { Telegraf } from "telegraf";
import dotenv from "dotenv"; dotenv.config(); //remove on prod

const bot = new Telegraf(process.env.BOT_TOKEN);

export default bot;