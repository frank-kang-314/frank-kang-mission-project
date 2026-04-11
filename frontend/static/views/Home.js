import AbstractView from "./AbstractView.js";
import { html, css } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Home')
    }

    async getHtml() {
        const response = await fetch(html("home.html"));
        return await response.text();
    }

    init () {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = css("home.css");
        document.head.appendChild(link);
        
        const chatboxSections = document.querySelectorAll(".chatbox-section");

        const taskSection = document.getElementById("add-task");
        const taskBackButton = document.getElementById("back-task");
        const taskInputField = document.getElementById("new-task")
        
        const reminderSection = document.getElementById("add-reminder");
        const reminderBackButton = document.getElementById("back-reminder");
        const reminderInputField = document.getElementById("new-reminder")

        chatboxSections.forEach(chatboxSection => {
            // Interactivity for task and reminder boxes
            chatboxSection.addEventListener("click", () => {
                
                // If section is clicked, expand it and collapse the other section
                chatboxSections.forEach(s => {
                    if (s === chatboxSection) {
                        s.classList.replace("split","expanded");
                    } else {
                        s.classList.replace("split","hidden");
                    }
                });

                // Show the back button and the input field
                setTimeout(() => {
                    console.log("Made button visible");
                    if (taskSection.classList.contains("expanded")) {
                        taskBackButton.classList.add("visible");
                        taskInputField.classList.add("visible")
                    } else if (reminderSection.classList.contains("expanded")) {
                        reminderBackButton.classList.add("visible");
                        reminderInputField.classList.add("visible") 
                    }
                }, 300);
            });
        });
        
        // Returning to split view
        const backButtons = document.querySelectorAll(".back-button");
        const inputFields = document.querySelectorAll(".add-item-field");
        backButtons.forEach(backButton => {
            backButton.addEventListener("click", () => {
                // Runs when any of the two back buttons are clicked
                chatboxSections.forEach(s => {
                    setTimeout(() => {
                        s.classList.remove("expanded", "hidden");
                        s.classList.add("split");
                        backButton.classList.remove("visible");
                    },300);
                });
                
                inputFields.forEach(inputField => {
                    inputField.classList.remove("visible");
                });
            });
        })
            
    }
}