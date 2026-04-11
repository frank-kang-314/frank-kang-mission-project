export const BASE_PATH =
    location.hostname.includes("github.io")
        ? "/" + location.pathname.split("/")[1]
        : "";