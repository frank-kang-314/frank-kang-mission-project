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

    init () {
        const chatboxSections = document.querySelectorAll(".chatbox-section");

        chatboxSections.forEach(chatboxSection => {
            chatboxSection.addEventListener("click", () => {
                console.log("Click");
                chatboxSections.forEach(s => {
                    if (s === chatboxSection) {
                        s.classList.add("expanded");
                    } else {
                        s.classList.add("hidden");
                    }
                });
            });
        });
    }
}