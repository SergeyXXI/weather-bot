import axios, { AxiosResponse } from "axios";
import { message } from "telegraf/filters";
import { BotContext, FinishRequestFn, Rule } from "types/index.js";
import { SHOW_WEATHER } from "./actions.js";
import { addKeyboard, getLocationQuery } from "./helpers.js";

const userRequest = 
{
    isActive: false,
    isRequestWhileActive: false
};

async function requestWeatherData(ctx: BotContext)
{        
    const url = "https://api.weather.yandex.ru/v2/informers";
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

async function requestPlaceData(ctx: BotContext)
{  
    if(!await isValid(ctx, ["command"])) return;

    const url = "https://nominatim.openstreetmap.org/search";
    const qLocation = getLocationQuery(
        ctx.has(message("location")) ? ctx.message.location : void 0
    );   

    userRequest.isActive = true;  

    const response = await axios.get(url,
    {
        params:
        {
            q: ctx.has(message("text")) && ctx.message.text || qLocation,
            format: "jsonv2",
            addressdetails: "1",            
            limit: "1",
            "accept-language": "ru-RU"
        },
        timeout: 8000        
    }).catch(error => error);    

    finishRequest({ ctx, textOnReady: "Готов к работе! Повторите запрос." });      

    return await isValid(ctx, ["status", "length"], response) ?
        response.data : null;   
   
} 

const finishRequest = ({ ctx, textOnReady = "✅ Готов к работе!", reply }: FinishRequestFn) =>
{
    setTimeout(async () =>
    {
        userRequest.isActive = false;

        if(userRequest.isRequestWhileActive)
        {
            userRequest.isRequestWhileActive = false;

            await ctx.reply(textOnReady);

            if(reply === SHOW_WEATHER)
            {
                await ctx.replyWithHTML(
                    `Регион: ${ctx.session.region.name}.`,
                    addKeyboard(SHOW_WEATHER)
                );   
            }
                     
        }
    }, 1000);
};

async function isValid(ctx: BotContext, rules: Rule[] = [], response?: AxiosResponse)
{
    for(let i = 0; i < rules.length; i++)
    {
        const rule = rules[i];
        const isString = typeof rule === "string";

        switch(isString ? rule : rule.name)
        {
            case "command":                         
                if(ctx.has(message("text")) && ctx.message.text.startsWith("/"))
                {
                    await ctx.reply(
                        `❌ Введён некорректный текст. Запрос не должен начинаться с "/". Попробуйте снова.`
                    );                   

                    return false;
                }
                else break;

            case "status":
                if(response && (!response.status || response.status >= 400))
                {
                    await ctx.reply(
                        "Произошла ошибка :( Немного подождите и попробуйте ещё раз.",
                        isString ? {} : addKeyboard(rule.action) || {}
                    ); 
                    
                    if(axios.isAxiosError(response))
                    {
                        console.log(response);                    
                        console.log("ERROR:", response.message);
                    }

                    return false;
                }  
                else break;

            case "length":                
                if(!response?.data?.length)
                {
                    await ctx.reply("Не смог найти указанный регион :( Попробуйте изменить запрос.");               
            
                    return false; 
                }
                else break;

            default: break;
        }
    }    

    return true;
}

export { requestWeatherData, requestPlaceData, userRequest };