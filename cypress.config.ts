import { defineConfig } from "cypress";
import dotenv from 'dotenv'
import {FRONTEND_URL} from "./src/utils/constants";
dotenv.config()

export default defineConfig({
  e2e: {
    setupNodeEvents(_, config) {
      config.env = process.env
      return config
    },
    experimentalStudio: true,
    baseUrl: FRONTEND_URL,
  },
  env: {
    AUTH0_USERNAME: process.env.AUTH0_USERNAME,
    AUTH0_PASSWORD: process.env.AUTH0_PASSWORD,
    AUTH0_USERNAME2: process.env.AUTH0_USERNAME2,
    AUTH0_PASSWORD2: process.env.AUTH0_PASSWORD2,
  }
});

