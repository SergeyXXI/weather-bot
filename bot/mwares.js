import { userRequest } from "./helpers.js";

const requestMW = async (ctx, next) =>
{
    if(!userRequest.isActive) return await next();
    else
    {
        if(ctx.callbackQuery) await ctx.answerCbQuery(); 
        if(userRequest.isRequestWhileActive) return;
        
        userRequest.isRequestWhileActive = true;
        await ctx.reply("❌ Временно недоступно, немного подождите...");
    }   
};

export { requestMW };