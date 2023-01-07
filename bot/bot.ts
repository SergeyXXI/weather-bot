import mongoose from "mongoose";
import { Telegraf } from "telegraf";
import { session } from "telegraf-session-mongoose";
import { BotContext } from "types/index.js";
import { stage } from "./regionScene.js";
import { initialMW, requestMW } from "./mwares.js";

await mongoose.connect(process.env.MONGODB_URL!);

const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

bot.use(
    session({ collectionName: "sessions" }),
    stage.middleware(), initialMW, requestMW
);

export default bot;