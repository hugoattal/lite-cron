import * as path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const alias = {
    "@": path.resolve(import.meta.dirname, "src")
};

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            fileName: "index",
            formats: ["es"]
        },
        rolldownOptions: { output: { minify: true } },
        target: "esnext"
    },
    plugins: [dts({ exclude: ["src/**/*.spec.ts"] })],
    resolve: {
        alias
    }
});
