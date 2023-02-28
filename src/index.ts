import config from "./config";
import { initCron } from "./scheduler";

const init = () => {
    initCron(config);

    console.log("\n=================Scheduler running=================\n");
};

init();
