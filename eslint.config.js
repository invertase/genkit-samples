// @ts-check

const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.export = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict
);
