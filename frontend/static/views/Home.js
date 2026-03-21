import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Home')
    }

    async getHtml() {
        const response = await fetch("/static/html/home.html");
        return await response.text();
    }
}
