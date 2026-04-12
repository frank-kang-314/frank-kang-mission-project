import AbstractView from "./AbstractView.js";
import { BASE_PATH } from "../js/config.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle('CookCookCook - Home')
    }

    async getHtml() {
        const response = await fetch(`${BASE_PATH}/static/html/home.html`);
        return await response.text();
    }

    init () {
        if (!document.querySelector('link[href*="home.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${BASE_PATH}/static/css/home.css`;
            document.head.appendChild(link);
        }

        const welcomeSetupPage = document.getElementById("welcome-page");
        const getStartedButton = document.getElementById("get-started");

        const loginSetupPage = document.getElementById("login-page");

        getStartedButton.addEventListener("click", ()=> {
            welcomeSetupPage.classList.remove("active");
            loginSetupPage.classList.add("active");
        });

        const CLIENT_ID = '425582770030-aqi82df9n7t92mhnhjnmkqhrck5sbb62.apps.googleusercontent.com';
        const API_KEY = 'AIzaSyBYOJdgCtyNzyrtqmsAVHP1DvRfbHg2mtM';

        const DISCOVERY_DOCS = [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
        ];

        const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar openid profile email';

        let tokenClient;
        let gapiInited = false;
        let gisInited = false;

        function gapiLoaded() {
            gapi.load('client', initializeGapiClient);
        }

        async function initializeGapiClient() {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
            gapiInited = true;
            maybeEnableButtons();
        }

        function gisLoaded() {
            tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '',
            });
            gisInited = true;
            maybeEnableButtons();
        }

        document.getElementById('authorize-button').disabled = true;

        function maybeEnableButtons() {
            if (gapiInited && gisInited) {
                document.getElementById('authorize-button').disabled = false;
            }
        }

        function handleAuthClick() {
            tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            const token = gapi.client.getToken();
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });
            const profile = await response.json();

            document.getElementById("login-prompt").innerText = "Login successful!";
            document.getElementById('authorize-button').style.visibility = 'hidden';

            const userProfileBox = document.getElementById("user-profile-box");
            const userProfileNameAndEmailBox = document.getElementById("user-profile-name-and-email");

            const userProfilePicture = document.createElement("img");
            userProfilePicture.src = profile.picture;
            userProfilePicture.id = "profile-picture";
            userProfilePicture.style.height = "100%";
            userProfilePicture.style.width = "auto";
            userProfilePicture.style.marginRight = "1vw";
            userProfilePicture.style.borderRadius = "50%";
            userProfileBox.prepend(userProfilePicture);

            const userProfileName = document.createElement("p");
            userProfileName.textContent = profile.name;
            userProfileName.id = "profile-name";
            userProfileName.style.fontSize = "3.5cqh";
            userProfileNameAndEmailBox.appendChild(userProfileName);

            const userProfileEmail = document.createElement("p");
            userProfileEmail.textContent = profile.email;
            userProfileEmail.id = "profile-email";
            userProfileEmail.style.fontSize = "1.5cqh";
            userProfileNameAndEmailBox.appendChild(userProfileEmail);

            userProfileBox.style.border = "1px solid black";
            userProfileBox.style.borderRadius = "4%";
            };

            if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
                tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
            // Skip display of account chooser and consent dialog for an existing session.
                tokenClient.requestAccessToken({prompt: ''});
            }
        }
        
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