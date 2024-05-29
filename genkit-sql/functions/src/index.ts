import * as admin from "firebase-admin";
import { initializeGenkit } from "@genkit-ai/core";

import config from "./genkit.config";

initializeGenkit(config);
admin.initializeApp();

export { generateOrExecuteSQL, ask } from "./flows";
