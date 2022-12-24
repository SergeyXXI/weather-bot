import { Markup } from "telegraf";
import { message } from "telegraf/filters";
import axios, { AxiosResponse } from "axios";
import { BotContext, Address, PlaceType, Location, FinishRequestFn, Rule } from "types/index.js";
import { 
    SHOW_WEATHER, CHANGE_REGION_OPTIONS, 
    CONFIRM_REGION, CONFIRM_REGION_YES    
} from "./actions.js";

const defaultRegion =
{
    name: "<b>Москва, район Орехово-Борисово Южное</b>",
    nameClean: "Москва, Орехово-Борисово Южное",
    lat: 55.610818,
    lon: 37.717454,
    isDefault: true
}; 

const userRequest = 
{
    isActive: false,
    isRequestWhileActive: false
};

const addKeyboard = (action: string, ctx?: BotContext) =>
{
    switch(action)
    {
        case SHOW_WEATHER:
            return Markup.inlineKeyboard(
            [
                Markup.button.callback("Узнать погоду", SHOW_WEATHER)          
            ]);

        case CHANGE_REGION_OPTIONS:              
            const customLocationBtn = Markup.button.locationRequest("🌍 Моя геолокация");
            const customCancelBtn = Markup.button.text("❌ Отмена");
            const customDefaultBtn = Markup.button.text(`${defaultRegion.nameClean}`);
            const row = ctx && ctx.session.isOwner ?
                [customLocationBtn, customCancelBtn, customDefaultBtn] :
                [customLocationBtn, customCancelBtn];                                       
            return Markup.keyboard(row, { columns: 2 }).resize(); 

        case CONFIRM_REGION:
            return Markup.inlineKeyboard(
            [                         
                Markup.button.callback("✅ Применить", CONFIRM_REGION_YES)               
            ]);        
        
        default: return;
    }
};

const removeKeyboard = () => Markup.removeKeyboard();

const getWeatherCondition = (condition: string) =>
{
    switch(condition)
    {
        case "clear": return "Ясно";
        case "partly-cloudy": return "Малооблачно";
        case "cloudy": return "Облачно с прояснениями";
        case "overcast": return "Пасмурно";
        case "drizzle": return "Морось";
        case "light-rain": return "Небольшой дождь";
        case "rain": return "Дождь";
        case "moderate-rain": return "Умеренно сильный дождь";
        case "heavy-rain": return "Сильный дождь";
        case "continuous-heavy-rain": return "Длительный сильный дождь";
        case "showers": return "Ливень";
        case "wet-snow": return "Дождь со снегом";
        case "light-snow": return "Небольшой снег";
        case "snow": return "Снег";
        case "snow-showers": return "Снегопад";
        case "hail": return "Град";
        case "thunderstorm": return "Гроза";
        case "thunderstorm-with-rain": return "Дождь с грозой";
        case "thunderstorm-with-hail": return "Гроза с градом";
        default: return "Неизвестное состояние";
    }
};

const getIconFileId = (icon: string) =>
{
    switch(icon)
    {
        case "ovc":
            return "AgACAgIAAxkDAAIKYmOgKjHbe3nH-P5C5clhIbddgR8MAAISyDEbwJgBSTmaLOH3iH47AQADAgADcwADLAQ"; 
        case "ovc_sn":
            return "AgACAgIAAxkDAAIKZGOgKjH-4XnxwPG59MW0Nb0BXsTvAAIUyDEbwJgBSTsoOqdevzs-AQADAgADcwADLAQ"; 
        case "ovc_-sn":
            return "AgACAgIAAxkDAAIKYWOgKjGZyKLRG18CjBmRoP8WR_vdAAIRyDEbwJgBSYssQuOxFPvkAQADAgADcwADLAQ"; 
        case "ovc_-ra":
            return "AgACAgIAAxkDAAIKYGOgKjE7tSDy1SGBfSUxO2AmEDKyAAIQyDEbwJgBSc1EP8h4jIlVAQADAgADcwADLAQ"; 
        case "ovc_ra_sn":
            return "AgACAgIAAxkDAAIKY2OgKjEZxgABMaaK3AMRZwtwDBNodwACE8gxG8CYAUmX_zMchCTGDwEAAwIAA3MAAywE"; 
        case "bkn_n":
            return "AgACAgIAAxkDAAIKX2OgKjCWVxDKQps1bIN_EdPwaIXsAAIPyDEbwJgBSdy0Zzwq2Pw_AQADAgADcwADLAQ"; 
        case "bkn_d":
            return "AgACAgIAAxkDAAIJ3WOfNguTQvc0Ktp9UvCVnadaEA_0AALSxDEbxYToSP3T4fMheqNKAQADAgADcwADLAQ"; 
        case "skc_n":
            return "AgACAgIAAxkDAAIKZmOgKjIiURyGc61nDtK580EUPY4GAAIWyDEbwJgBSXZNayEaHf1OAQADAgADcwADLAQ"; 
        case "skc_d":
            return "AgACAgIAAxkDAAIKZWOgKjHcnocaDrIkoWxGONtOocToAAIVyDEbwJgBSQronCiAzrXtAQADAgADcwADLAQ";        
        
        default: return null;
    }
};

const formRegionName = (address: Address, type: PlaceType) =>
{
    const {
        municipality = "", county = "", state = "", suburb = "",
        country = "", country_code: countryCode = ""
    } = address; 
    const place = address[type] || address.city_district || address.city || address.town ||
    address.suburb && address.state || address.hamlet || "НП не определён"; 
    const result = [place];  
        
    if(municipality)                    result.push(municipality);
    if(suburb)                          result.push(suburb);
    if(county)                          result.push(county);
    if(state && state !== place)        result.push(state);
    if(country && countryCode !== "ru") result.push(country);        

    return `<b>${result.join(", ")}</b>`;
};

const getLocationQuery = (location?: Location) =>
    location ? `${location.latitude}, ${location.longitude}` : null;

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
                    
                    if(axios.isAxiosError(response)) console.log(response.message);

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

export { 
    defaultRegion, formRegionName,
    addKeyboard, removeKeyboard, 
    getWeatherCondition, getIconFileId, getLocationQuery,
    userRequest, finishRequest, isValid
};