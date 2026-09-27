import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

export default defineConfig({
    plugins: [
        sveltekit(),
        {
            name: "static-index-html-serve",
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url) {
                        const cleanUrl = req.url.split("?")[0];
                        if (cleanUrl.endsWith("/") || !path.extname(cleanUrl)) {
                            const trimmed = cleanUrl.replace(/^\/|\/$/g, "");
                            const candidate = path.join(process.cwd(), "static", trimmed, "index.html");
                            if (fs.existsSync(candidate)) {
                                req.url = (cleanUrl.endsWith("/") ? cleanUrl : cleanUrl + "/") + "index.html" + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");
                            }
                        }
                    }
                    next();
                });
            }
        }
    ],
    server: {
        fs: {
            allow: ["../shared"],
        },
    },
});
