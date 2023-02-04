import { PassThrough } from "node:stream";
import { readdir } from "fs/promises";
import { extname } from "path";

import { google } from "googleapis";

import { Extract } from "unzipper";

import config from "../config";

class HandlerClass {
    private driveClient;

    constructor(
        clientID: string,
        clientSecret: string,
        redirectURI: string,
        refreshToken: string
    ) {
        this.driveClient = this.createDriveClient(
            clientID,
            clientSecret,
            redirectURI,
            refreshToken
        );
    }

    private createDriveClient(
        clientID: string,
        clientSecret: string,
        redirectURI: string,
        refreshToken: string
    ) {
        const client = new google.auth.OAuth2(
            clientID,
            clientSecret,
            redirectURI
        );

        client.setCredentials({ refresh_token: refreshToken });

        return google.drive({
            version: "v3",
            auth: client,
        });
    }

    private async findAndExtractFiles(
        currentDir: string,
        extractionDir: string | null
    ) {
        const files = await readdir(currentDir);

        if (currentDir === config.dirs.origin) {
            for (const file of files) {
                const extension = extname(file);

                if (extension === ".zip") {
                    Extract({
                        path: extractionDir,
                    });
                }
            }

            await this.findAndExtractFiles(extractionDir, null);
        } else return files;
    }

    async saveFiles(
        originDir: string,
        extractionDir: string,
        targetFolderID?: string
    ) {
        const extractedFiles = await this.findAndExtractFiles(
            originDir,
            extractionDir
        );

        if (extractedFiles) {
            extractedFiles.forEach((file: any) => {
                const bufferStream = new PassThrough();

                bufferStream.end(file.buffer);

                return this.driveClient.files.create({
                    requestBody: {
                        name: file?.name,
                        mimeType: file?.mimeType,
                        parents: targetFolderID ? [targetFolderID] : [],
                    },
                    media: {
                        mimeType: file?.mimeType,
                        body: bufferStream,
                    },
                });
            });
        }
    }
}

export const Handler = new HandlerClass(
    config.google.client.id as string,
    config.google.client.secret as string,
    config.google.redirectURI as string,
    config.google.refreshToken as string
);
