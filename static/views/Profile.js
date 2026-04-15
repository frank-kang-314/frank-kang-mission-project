import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Profile');
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/profile.html`);
        return await response.text();
    }

    init () {
        if (!document.querySelector('link[href*="profile.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_PATH}/static/css/profile.css`;
            document.head.appendChild(link);
        }
    }
}