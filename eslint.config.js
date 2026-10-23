import lpConfigTs from "@luna-park/eslint-config/typescript";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/dist/*"]
    },
    ...lpConfigTs
);
