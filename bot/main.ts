import { message } from "telegraf/filters";
import bot from "./bot.js";
import { addKeyboard, removeKeyboard } from "./helpers.js";
import { regionScene } from "./regionScene.js";
import { SHOW_WEATHER } from "./actions.js";
import { showWeather } from "./handlers.js";
import { getJobs } from "./cron.js";

bot.start(async ctx =>
{    
    await ctx.reply("Приветствую!", removeKeyboard());
    await ctx.replyWithHTML(
        "Я показываю погоду в выбранном регионе. " +
        "Регион можно изменить командой /region." + "\n" +
        `Регион: ${ctx.session.region.name}.`,
        addKeyboard(SHOW_WEATHER)
    );     
});

bot.command("region", async ctx => await ctx.scene.enter(regionScene.id));

bot.command("schedule", async ctx =>
{        
    if(!ctx.session.isOwner && !ctx.session.isCasual)
    {
        await ctx.reply("❌ Доступ запрещён. Раздел для админа.");
        return;
    }    

    const jobs = getJobs(ctx);

    if(!ctx.session.hasShedule)
    {
        ctx.session.hasShedule = true;     
        jobs.forEach(job => job.resume());   
        await ctx.reply("✅ Информирование по расписанию включено!");
    }
    else
    {
        ctx.session.hasShedule = false;        
        jobs.forEach(job => job.pause());
        await ctx.reply("❗ Информирование по расписанию выключено!");
    }
});

bot.action(SHOW_WEATHER, async ctx =>
{
    await ctx.answerCbQuery();   
    
    showWeather(ctx);
});

bot.on(message("text"), async ctx =>
{     
    await ctx.reply("❌ Обработка текста сейчас недоступна.");

    await ctx.replyWithHTML(
        `Регион: ${ctx.session.region.name}.`,
        addKeyboard(SHOW_WEATHER)
    ); 
});

// bot.launch({ dropPendingUpdates: true });

bot.launch(
{
    webhook:
    {
        domain: process.env.WEBHOOK_DOMAIN!,
        hookPath: process.env.WEBHOOK_PATH,
        port: +process.env.PORT! || 3000
    },
    dropPendingUpdates: true
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));