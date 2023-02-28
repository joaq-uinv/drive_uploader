import { readdir } from "fs/promises";
import { createReadStream, statSync, unlink } from "fs";
import { basename, extname, join } from "path";

import { google } from "googleapis";

import { Extract } from "unzipper";

import config from "../config";

class HandlerClass {
    private driveClient;

    constructor(clientID: string, clientSecret: string, redirectURI: string, refreshToken: string) {
        this.driveClient = this.createDriveClient(clientID, clientSecret, redirectURI, refreshToken);
    }

    private createDriveClient(clientID: string, clientSecret: string, redirectURI: string, refreshToken: string) {
        const client = new google.auth.OAuth2(clientID, clientSecret, redirectURI);

        client.setCredentials({ refresh_token: refreshToken });

        return google.drive({
            version: "v3",
            auth: client,
        });
    }

    private async extractAndUpload(currentDir: string, extractionDir: string | null, cronFrequencyMS: number, driveFolderName: string) {
        try {
            //GET FILES FROM SPECIFIED DIR AND LOOP THEM
            const files = await readdir(currentDir);

            if (currentDir === config.dirs.origin) {
                console.log("Looking for files...");

                files.forEach((file: any) => {
                    const extension = extname(file);

                    //EXTRACT ZIP FILES ON SPECIFIED DIR
                    if (extension !== ".zip") return;

                    console.log(`\n------------------ Zip file found. Extracting ${file} ------------------`);

                    const zipFilePath = join(currentDir, file);

                    createReadStream(zipFilePath)
                        .pipe(
                            Extract({
                                path: extractionDir,
                            })
                        )
                        .on("close", async () => {
                            console.log(`\n------------------ ${file} successfully extracted in ${extractionDir} ------------------`);

                            //DELETE ZIP FILE AFTER BEING EXTRACTED
                            this.deleteFile(zipFilePath);

                            //GET EXTRACTED DIRS/FILES. THE ONES TO BE UPLOADED SHOULD HAVE BEEN EXTRACTED DURING THE CURRENT LOOP OF THE CRON JOB
                            const extracted = await this.getExtracted(extractionDir, cronFrequencyMS);

                            //SEARCH FOR SPECIFIED FOLDER IN DRIVE
                            const folder: any = await this.searchFolder(driveFolderName);

                            //UPLOAD TO GOOGLE DRIVE EXTRACTED FILES/DIRS
                            await this.upload(extracted, folder.id);
                        });
                });
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    async saveFiles({ originDir, extractionDir, cronFrequencyMS, driveFolderName }: any) {
        try {
            await this.extractAndUpload(originDir, extractionDir, cronFrequencyMS, driveFolderName);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    private deleteFile(path: string) {
        unlink(path, (err: any) => {
            if (err) console.error(err);

            console.log(`\n---------------${path} deleted---------------`);
        });
    }

    private async getExtracted(path: string, cronFrequencyMS: number) {
        try {
            const extracted = await readdir(path);

            const toBeUploaded: any[] = [];

            extracted.forEach((dir: string) => {
                dir = join(path, dir);

                const stats = statSync(dir);

                const now = new Date().getTime();

                if (stats.birthtimeMs < now && stats.birthtimeMs >= now - cronFrequencyMS) {
                    toBeUploaded.push(dir);
                }
            });

            return toBeUploaded;
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    private searchFolder(folderName: string) {
        return new Promise((resolve, reject) => {
            this.driveClient.files.list(
                {
                    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
                    fields: "files(id, name)",
                },
                (err, res: { data: any }) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(res.data.files ? res.data.files[0] : null);
                }
            );
        });
    }

    private async createSubFolder(dir: string, driveFolderId: string): Promise<any> {
        try {
            const directory = dir.split("/");
            dir = directory[directory.length - 1];

            const folderMetadata = {
                name: dir,
                mimeType: "application/vnd.google-apps.folder",
                parents: [driveFolderId],
            };

            const folder = await this.driveClient.files.create({
                requestBody: folderMetadata,
                fields: "id",
            });

            console.log(`\nFolder ${dir} created in Google Drive with ID: ${folder.data.id}`);

            return folder;
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    async upload(localDirs: string[], driveFolderId: string) {
        try {
            for (const localDir of localDirs) {
                const files = await readdir(localDir);
                const driveFolder = await this.createSubFolder(localDir, driveFolderId);

                for (const file of files) {
                    const filePath = join(localDir, file);
                    const fileName = basename(filePath);

                    const fileMetadata = {
                        name: fileName,
                        mimeType: "application/octet-stream",
                        parents: [driveFolder.data.id],
                    };
                    const media = {
                        mimeType: "application/octet-stream",
                        body: createReadStream(filePath),
                    };

                    await this.driveClient.files.create({
                        requestBody: fileMetadata,
                        media,
                        fields: "id",
                    });

                    console.log(`File ${fileName} uploaded to Google Drive in folder with ID: ${driveFolder.data.id}`);
                }
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}

export const Handler = new HandlerClass(
    config.google.client.id as string,
    config.google.client.secret as string,
    config.google.redirectURI as string,
    config.google.refreshToken as string
);
