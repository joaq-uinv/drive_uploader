import { config } from "dotenv";
const envFound = config();

if (!envFound) {
    throw new Error("The .env file could not be found.");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

export default {
    cron: {
        frequency: process.env.CRON_FREQUENCY,
    },
};
