import { Context, Scenes } from "telegraf";
import { RegionWizardSession } from "./regionScene-types.js";

type BotSession = 
{
    region:
    {
        name: string,
        nameClean?: string,
        lat: number | string,
        lon: number | string,
        isDefault: boolean
    },
    isOwner: boolean,
    isCasual: boolean,
    hasShedule: boolean    
} & Scenes.WizardSession<RegionWizardSession>;

type BotContext = 
{    
    session: BotSession,    
	scene: Scenes.SceneContextScene<BotContext, RegionWizardSession>,	
	wizard: Scenes.WizardContextWizard<BotContext>    
} & Context;

export { BotContext };