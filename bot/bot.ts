import { Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import { BotContext } from "types/index.js";
import { stage } from "./regionScene.js";
import { initialMW, requestMW } from "./mwares.js";

const db = process.env.NODE_ENV === "dev" ? "bot/db-dev.json" : "dist/db.json";

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);
const session = new LocalSession(
    { database: db, storage: LocalSession.storageFileAsync }
).middleware();

bot.use(session, stage.middleware(), initialMW, requestMW);

export default bot;