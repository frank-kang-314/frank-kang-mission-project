import AbstractView from "./AbstractView.js";
import { html, css } from "../js/setup.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Calendar');
    }

    async getHtml() {
        const response = await fetch(html("home.html"));
        return await response.text();
    }

    init () {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = css("calendar.css");
        document.head.appendChild(link);
    }
}