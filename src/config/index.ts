import { config } from "dotenv";
const envFound = config();

if (!envFound) {
    throw new Error("The .env file could not be found.");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

export default {
    cron: {
        frequency: process.env.CRON_FREQUENCY,
        frequencyMS: process.env.CRON_FREQUENCY_MILISECONDS,
    },
    google: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        redirectURI: process.env.GOOGLE_REDIRECT_URI,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        driveFolderName: process.env.GOOGLE_DRIVE_FOLDER_NAME,
    },
    dirs: {
        origin: process.env.ORIGIN_DIR,
        extraction: process.env.EXTRACTION_DIR,
    },
};
