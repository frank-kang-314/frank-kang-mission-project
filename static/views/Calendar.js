import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Calendar');
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/calendar.html`);
        return await response.text();
    }

    init () {
        if (!document.querySelector('link[href*="calendar.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_PATH}/static/css/calendar.css`;
            document.head.appendChild(link);
        }
    }
}