import Cron from "croner";
import { BotContext } from "types/index.js";
import { showWeather } from "./handlers.js";

const cronJobs: Cron[] = [];

function getJobs(ctx?: BotContext)
{
    if(!cronJobs.length && ctx)
    {
        cronJobs.push( 
            Cron("30 19 * * *", () => showWeather(ctx),
                { paused: true, timezone: "Europe/Moscow" })            
        );
    }    

    return cronJobs;
}

export { getJobs }