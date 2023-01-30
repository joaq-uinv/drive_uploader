import { schedule, validate } from "node-cron";

import { handler } from "../handlers";

export const initCron = (config: any) => {
    try {
        if (validate(config.cron.frequency))
            schedule(config.cron.frequency, () => handler());
    } catch (error) {
        throw error;
    }
};
