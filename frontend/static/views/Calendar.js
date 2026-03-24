import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Calendar')
    }

    async getHtml() {
        const response = await fetch("/static/html/calendar.html");
        return await response.text();
    }

    init () {
        ((path) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = path;
            document.head.appendChild(link);
        })("/static/css/calendar.css");
        console.log("hello");
    }
}