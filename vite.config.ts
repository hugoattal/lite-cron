import * as path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite";

const alias = {
    "@": path.resolve(__dirname, "src")
};

export default defineConfig({
    build: {
        lib: {
            name: "lite-cron",
            entry: "src/index.ts",
            fileName: "index"
        },
        target: "esnext"
    },
    plugins: [dts()],
    resolve: {
        alias
    }
});
