const CLIENT_ID = '425582770030-aqi82df9n7t92mhnhjnmkqhrck5sbb62.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBYOJdgCtyNzyrtqmsAVHP1DvRfbHg2mtM';

const DISCOVERY_DOCS = [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file openid profile email';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function enterApp() {
    console.log("Enter app");

    document.querySelector('.login').style.display = 'none';

    document.querySelectorAll(".hide-before-login").forEach(el => {
        el.classList.remove("hide-before-login");
    });
}

export function applyLoginState() {
    if (localStorage.getItem("loggedIn") === "true") {

        document.querySelectorAll(".hide-before-login").forEach(el => {
            el.classList.remove("hide-before-login");
        });

    }
}

document.addEventListener('DOMContentLoaded', () => {

    const loggedIn = localStorage.getItem("loggedIn");

    if (loggedIn === "true") {
        enterApp();
        return;
    }

    document.getElementById('authorize-button').disabled = true;
    document.getElementById('start-app').style.visibility = 'hidden';

    maybeEnableButtons();

    document.getElementById('get-started').addEventListener('click', () => {
        document.getElementById('welcome-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
    });

    document.getElementById('authorize-button').addEventListener('click', () => {
        handleAuthClick();
    });

    document.getElementById('start-app').addEventListener('click', () => {
        enterApp();
    });
});

window.gapiLoaded = function() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });

    // Load all needed client libraries AFTER init completes
    await Promise.all([
        gapi.client.load("sheets", "v4"),
        gapi.client.load("calendar", "v3"),
        gapi.client.load("drive", "v3"),
    ]);

    gapiInited = true;
    maybeEnableButtons();
}

window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        const btn = document.getElementById('authorize-button');
        if (btn) {
            btn.disabled = false;
        }
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

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userProfile", JSON.stringify(profile));

    document.getElementById("login-prompt").innerText = "Login successful!";
    document.getElementById("login-prompt").style.fontSize = "3cqh";
    document.getElementById('authorize-button').style.visibility = 'hidden';
    document.getElementById("start-app").style.visibility= "visible";

    const userProfileBox = document.getElementById("user-profile-box");
    const userProfileNameAndEmailBox = document.getElementById("user-profile-name-and-email");

    const userProfilePicture = document.createElement("img");
    userProfilePicture.src = profile.picture;
    userProfilePicture.id = "profile-picture";
    userProfilePicture.style.height = "80%";
    userProfilePicture.style.width = "auto";
    userProfilePicture.style.marginRight = "1vw";
    userProfilePicture.style.borderRadius = "50%";
    userProfileBox.prepend(userProfilePicture);

    const userProfileName = document.createElement("p");
    userProfileName.textContent = profile.name;
    userProfileName.id = "profile-name";
    userProfileName.style.fontSize = "2.5cqh";
    userProfileNameAndEmailBox.appendChild(userProfileName);

    const userProfileEmail = document.createElement("p");
    userProfileEmail.textContent = profile.email;
    userProfileEmail.id = "profile-email";
    userProfileEmail.style.fontSize = "1.5cqh";
    userProfileNameAndEmailBox.appendChild(userProfileEmail);

    userProfileBox.style.border = "1px solid black";
    userProfileBox.style.borderRadius = "15px";
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