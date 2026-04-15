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

        const profile = JSON.parse(localStorage.getItem("userProfile"));

        const profilePicture = document.createElement("img");
        profilePicture.src = profile.picture;
        profilePicture.id = "user-profile-picture";

        const profileName = document.createElement("p");
        profileName.textContent = profile.name;
        profileName.id = "user-profile-name";

        const profileEmail = document.createElement("p");
        profileEmail.textContent = profile.email;
        profileEmail.id = "user-profile-email";

        document.querySelector(".profile-box").prepend(profilePicture);
        document.querySelector(".profile-info-box").appendChild(profileName);
        document.querySelector(".profile-info-box").appendChild(profileEmail);

        document.getElementById("signout").addEventListener('click', () => {
            const token = gapi.client.getToken();
            if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            localStorage.setItem("loggedIn", "false");
            window.location.reload();
            }
        });
    }
}