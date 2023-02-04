import { schedule, validate } from "node-cron";

import { Handler } from "../handlers";

export const initCron = (config: any) => {
    try {
        if (validate(config.cron.frequency))
            schedule(config.cron.frequency, () =>
                Handler.saveFiles(config.dirs.origin, config.dirs.extraction)
            );
    } catch (error) {
        throw error;
    }
};
