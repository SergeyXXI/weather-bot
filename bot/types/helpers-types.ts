import { BotContext } from "./bot-types.js";
import { SHOW_WEATHER } from "actions.js";

type Address = 
{
    municipality: string,
    county: string,
    state: string,
    suburb: string,
    country: string,
    country_code: string,
    city: string
    city_district: string,
    town: string,
    hamlet: string    
};

type PlaceType = "city" | "town" | "hamlet";

type Location = 
{
    latitude: number,
    longitude: number
};

type FinishRequestFn =
{
    ctx: BotContext,
    textOnReady?: string,
    reply?: typeof SHOW_WEATHER
};

type Rule = string |
{
    name: string,
    action: typeof SHOW_WEATHER
};

export { 
    type Address, type PlaceType, type Location,
    type FinishRequestFn, type Rule
}; 