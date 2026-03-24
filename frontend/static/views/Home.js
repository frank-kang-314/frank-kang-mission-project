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
        ((path) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = path;
            document.head.appendChild(link);
        })("/static/css/home.css");
        document.querySelector(".page").innerHTML = "";
        
        const chatboxSections = document.querySelectorAll(".chatbox-section");
        const taskSection = document.getElementById("add-task");
        const reminderSection = document.getElementById("add-reminder");
        const taskBackButton = document.getElementById("back-task");
        const reminderBackButton = document.getElementById("back-reminder");
        chatboxSections.forEach(chatboxSection => {
            chatboxSection.addEventListener("click", () => {
                console.log("Click");
                chatboxSections.forEach(s => {
                    if (s === chatboxSection) {
                        s.classList.replace("split","expanded");
                    } else {
                        s.classList.add("split","hidden");
                    }
                });
                setTimeout(() => {
                    console.log("Made button visible");
                    if (taskSection.classList.contains("expanded")) {
                        taskBackButton.classList.add("visible");
                    } else if (reminderSection.classList.contains("expanded")) {
                        reminderBackButton.classList.add("visible");
                    }
                }, 300);
            });
        });
        
        const backButtons = document.querySelectorAll(".back-button");
        backButtons.forEach(backButton => {
            backButton.addEventListener("click", () => {
                console.log("Back button click");
                chatboxSections.forEach(s => {
                    setTimeout(() => {
                        s.classList.remove("expanded", "hidden");
                        s.classList.add("split");
                        backButton.classList.remove("visible");
                    },300);
                        
                });
            });
        })
            
    }
}