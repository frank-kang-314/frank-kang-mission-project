import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../static/js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Calendar');
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/frontend/static/html/calendar.html`);
        return await response.text();
    }

    init () {
        ((path) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = path;
            document.head.appendChild(link);
        })(`${BASE_PATH}/frontend/static/css/calendar.css`);
    }
}