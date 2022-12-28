import { BotContext } from "types/index.js";
import { requestWeatherData } from "./client.js";
import { addKeyboard, getIconFileId, getWeatherCondition } from "./helpers.js";
import { SHOW_WEATHER } from "./actions.js";

async function showWeather(ctx: BotContext)
{
    const result = await requestWeatherData(ctx);

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
}

export { showWeather };