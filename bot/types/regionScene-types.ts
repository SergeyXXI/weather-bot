import { Scenes } from "telegraf";

type RegionWizardSession = 
{
    region:
    {
        name: string,
        nameClean?: string,
        lat: number | string,
        lon: number | string,
        isDefault: boolean
    }
} & Scenes.WizardSessionData;

export { type RegionWizardSession };