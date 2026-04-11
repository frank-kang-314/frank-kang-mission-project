import { BASE_PATH } from "./config.js";

export const html = file => `${BASE_PATH}/frontend/static/html/${file}`;
export const css = file => `${BASE_PATH}/frontend/static/css/${file}`;
export const img = file => `${BASE_PATH}/frontend/assets/images/${file}`;