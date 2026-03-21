import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Home')
    }

    async getHtml() {
        return `
            <div class="home-box stats">

            </div>
            <div class="home-box info">
                <div class="home-task-overview"></div>
            </div>
            <div class="home-box add-task">

            </div>
        `
    }
}