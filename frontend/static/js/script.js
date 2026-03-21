import Home from "../views/Home.js";

const navigateTo = url => {
    history.pushState(null,null,url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/", view: Home },
        { path: "/calendar", view: () => console.log("Viewing calendar") },
        { path: "/projects", view: () => console.log("Viewing projects") },
        { path: "/habits", view: () => console.log("Viewing habits") },
        { path: "/settings", view: () => console.log("Viewing settings") },
        { path: "/profile", view: () => console.log("Viewing profile") },
        { path: "/404notfound", view: () => console.log("Viewing 404NotFound") }
    ];

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        }
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch)

    if (!match) {
        match =  {
            route: routes.find(route => route.path === "/404notfound"),
            isMatch: true
        };
    }

    const view = new match.route.view();

    document.querySelector(".page").innerHTML = await view.getHtml();

    console.log(view);
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () =>  {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    router();
});