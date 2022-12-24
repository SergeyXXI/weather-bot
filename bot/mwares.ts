import { MiddlewareFn } from "telegraf";
import { BotContext } from "types/index.js";
import { defaultRegion, userRequest } from "./helpers.js";

const initialMW: MiddlewareFn<BotContext> = async (ctx, next) =>
{    
    ctx.session.region ??= { ...defaultRegion };
    ctx.session.isOwner ??= ctx.message?.from.id === +process.env.OWNER_ID! ||
                            ctx.callbackQuery?.from.id === +process.env.OWNER_ID!;    

    await next();
};

const requestMW: MiddlewareFn<BotContext> = async (ctx, next) =>
{
    if(!userRequest.isActive) return await next();
    else
    {
        if(ctx.callbackQuery) await ctx.answerCbQuery(); 
        if(userRequest.isRequestWhileActive) return;
        
        userRequest.isRequestWhileActive = true;
        await ctx.reply("❌ Временно недоступно, немного подождите и повторите попытку.");
    }   
};

export { initialMW, requestMW };