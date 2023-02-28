import { schedule, validate } from "node-cron";

import { Handler } from "../handlers";

export const initCron = (config: any) => {
    if (validate(config.cron.frequency)) {
        schedule(config.cron.frequency, async () => {
            try {
                await Handler.saveFiles({
                    originDir: config.dirs.origin,
                    extractionDir: config.dirs.extraction,
                    cronFrequencyMS: config.cron.frequencyMS,
                    driveFolderName: config.google.driveFolderName,
                });
            } catch (error) {
                throw error;
            }
        });
    }
};
