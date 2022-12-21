import axios from "axios";
import { message } from "telegraf/filters";
import bot from "./bot/bot.js";
import { 
    addKeyboard, removeKeyboard, isValid,
    getIconFileId, getWeatherCondition, userRequest, finishRequest
} from "./bot/helpers.js";
import { regionScene } from "./bot/regionScene.js";
import { SHOW_WEATHER } from "./bot/actions.js";

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

bot.action(SHOW_WEATHER, async ctx =>
{
    await ctx.answerCbQuery();   
    
    const result = await getWeatherData(ctx);

    if(!result) return;

    const {
        temp, feels_like: feelsLike, icon,
        condition: _condition, prec_type: _precType   
    } = result;    

    const iconId = getIconFileId(icon);
    const condition = getWeatherCondition(_condition);
    const precType = _precType === 0 ? ", без осадков." : ".";     
    
    if(iconId) await ctx.replyWithPhoto(iconId);
    else       console.log("НОВАЯ ИКОНКА", icon);      
    
    await ctx.replyWithHTML(        
        `Сейчас <b>${temp}°</b>.\n` +
        `Ощущается как ${feelsLike}°.\n` +
        condition + precType,
        addKeyboard(SHOW_WEATHER)
    );      

});

bot.on(message("text"), async ctx =>
{ 
    await ctx.reply("❌ Обработка текста сейчас недоступна.");

    await ctx.replyWithHTML(
        `Регион: ${ctx.session.region.name}.`,
        addKeyboard(SHOW_WEATHER)
    ); 
});

async function getWeatherData(ctx)
{    
    const url = "https://api.weather.yandex.ru/v2/forecast";
    const { lat, lon } = ctx.session.region;    

    userRequest.isActive = true; 

    const response = await axios.get(url,
    {
        params: { lat, lon, limit: 1 },
        headers:
        {        
            "X-Yandex-API-Key": process.env.YAPOGODA_TOKEN        
        },
        timeout: 8000
    }).catch(error => error);    

    finishRequest({ ctx, reply: SHOW_WEATHER });   

    return await isValid(ctx, [{ name: "status", action: SHOW_WEATHER}], response) ?
        response.data.fact : null;   
   
}

bot.launch({ dropPendingUpdates: true });

// bot.launch(
// {
//     webhook:
//     {
//         domain: process.env.WEBHOOK_DOMAIN,
//         hookPath: process.env.WEBHOOK_PATH,
//         port: +process.env.WEBHOOK_PORT
//     },
//     dropPendingUpdates: true
// });