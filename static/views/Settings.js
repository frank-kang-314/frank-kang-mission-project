import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Settings');
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/settings.html`);
        return await response.text();
    }

    init () {
        if (!document.querySelector('link[href*="settings.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_PATH}/static/css/settings.css`;
            document.head.appendChild(link);
        }
    }
}