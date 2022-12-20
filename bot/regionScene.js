import { Scenes } from "telegraf";
import axios from "axios";
import {
    SHOW_WEATHER, CHANGE_REGION_OPTIONS,
    CONFIRM_REGION, CONFIRM_REGION_YES 
} from "./actions.js";
import {
    addKeyboard, removeKeyboard, userRequest, finishRequest,
    defaultRegion, formRegionName, getLocationQuery, isValid
} from "./helpers.js";
import { requestMW } from "./mwares.js";

const handleUserText = async ctx =>
{     
    if(!ctx.message)
    {
        ctx.scene.leave();
        return;
    }   

    const data = await getPlaceData(ctx);    

    if(!data) return;    

    const result = data[0];
    const { display_name: place, type, lat, lon } = result;
    const name = formRegionName(result.address, type);   

    ctx.scene.state.region = { name, lat, lon, isDefault: false };

    await ctx.replyWithHTML(        
        `<b>${place}</b>.\n` +
        "Если регион определён неверно, попробуйте указать его снова через пару секунд, переформулировав запрос.",
        addKeyboard(CONFIRM_REGION));    
     
};

const scene = new Scenes.WizardScene("regionScene", handleUserText);
const stage = new Scenes.Stage([scene]);

scene.use(requestMW);

scene.enter(async ctx =>
{      
    await ctx.replyWithHTML(`Текущий регион: ${ctx.session.region.name}`);    
    await ctx.replyWithHTML(
        `Напишите город/населённый пункт(далее "НП"), для которого желаете смотреть погоду.\n` +
        "Придерживайтесь официальных названий, " +
        "не указывайте типы НП(город, пгт, посёлок, село, деревня и т.п.) " +
        "и разделяйте части адреса запятыми.\n" +
        "Пример №1: <i>Санкт-Петербург</i>.\n" +
        "Пример №2: <i>Вятское, Ярославская область</i>.",
        addKeyboard(CHANGE_REGION_OPTIONS, ctx)
    );
});

scene.hears(["❌ Отмена", "Отмена"], async ctx =>
{
    await ctx.reply("❌", removeKeyboard());
    await ctx.scene.leave();
});

scene.action(CONFIRM_REGION_YES, async ctx =>
{
    await ctx.answerCbQuery();
    await ctx.reply("✅", removeKeyboard());

    ctx.session.region = ctx.scene.state.region ?
        { ...ctx.scene.state.region } :
        { ...defaultRegion };

    await ctx.scene.leave();     
});

scene.leave(async ctx =>
{    
    if(ctx.myChatMember) return;

    await ctx.replyWithHTML(
        `Регион: ${ctx.session.region.name}.`,
        addKeyboard(SHOW_WEATHER)
    );
});

async function getPlaceData(ctx)
{  
    if(!await isValid(ctx, ["command"])) return;

    const url = "https://nominatim.openstreetmap.org/search";
    const qLocation = getLocationQuery(ctx.message.location);   

    userRequest.isActive = true;  

    const response = await axios.get(url,
    {
        params:
        {
            q: ctx.message.text || qLocation,
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

export { scene as regionScene, stage };