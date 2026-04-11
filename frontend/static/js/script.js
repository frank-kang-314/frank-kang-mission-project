import Home from "../views/Home.js";
import Calendar from "../views/Calendar.js";
import { BASE_PATH } from "./config.js";

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {

    const path = location.pathname.replace(BASE_PATH, "") || "/";

    const routes = [
        { path: "/", view: Home },
        { path: "/calendar", view: Calendar },
        { path: "/projects", view: () => console.log("Viewing projects") },
        { path: "/habits", view: () => console.log("Viewing habits") },
        { path: "/settings", view: () => console.log("Viewing settings") },
        { path: "/profile", view: () => console.log("Viewing profile") },
        { path: "/404notfound", view: () => console.log("Viewing 404NotFound") }
    ];

    const match = routes.find(r => r.path === path) || { view: Home };

  const view = new match.view();

  document.querySelector(".page").innerHTML =
    await view.getHtml();

  view.init();
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {

  document.body.addEventListener("click", e => {

    if (e.target.matches("[data-link]")) {
      e.preventDefault();
      navigateTo(new URL(e.target.href).pathname);
    }

  });

  router();
});