import config from "./config";
import { initCron } from "./scheduler";

const init = () => {
    initCron(config);
};

init();
