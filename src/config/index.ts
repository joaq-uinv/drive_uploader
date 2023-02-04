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
    google: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        redirectURI: process.env.GOOGLE_REDIRECT_URI,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        targetFolderID: process.env.GOOGLE_TARGET_FOLDER_ID,
    },
    dirs: {
        origin: process.env.ORIGIN_DIR,
        extraction: process.env.EXTRACTION_DIR,
    },
};
