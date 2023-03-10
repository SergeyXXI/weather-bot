import { Scenes} from "telegraf";
import { BotContext } from "types/index.js";
import {
    SHOW_WEATHER, CHANGE_REGION_OPTIONS,
    CONFIRM_REGION, CONFIRM_REGION_YES 
} from "./actions.js";
import { addKeyboard, removeKeyboard, defaultRegion, formRegionName } from "./helpers.js";
import { requestMW } from "./mwares.js";
import { requestPlaceData } from "./client.js";

const scene = new Scenes.WizardScene<BotContext>("regionScene", handleUserText);
const stage = new Scenes.Stage<BotContext>([scene]);

async function handleUserText(ctx: BotContext)
{     
    if(!ctx.message)
    {
        ctx.scene.leave();
        return;
    }   

    const data = await requestPlaceData(ctx);    

    if(!data) return;    

    const result = data[0];
    const { display_name: place, type, lat, lon } = result;
    const name = formRegionName(result.address, type);    

    ctx.scene.session.region = { name, lat, lon, isDefault: false };

    await ctx.replyWithHTML(        
        `<b>${place}</b>.\n` +
        "Если регион определён неверно, попробуйте указать его снова через пару секунд, переформулировав запрос.",
        addKeyboard(CONFIRM_REGION));    
     
};

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

    ctx.session.region = ctx.scene.session.region ?
        { ...ctx.scene.session.region } :
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

export { scene as regionScene, stage };