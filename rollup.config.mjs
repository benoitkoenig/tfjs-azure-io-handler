import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

/** This plugin ensures that the browser build imports browser files */
const browserAliasPlugin = alias({
  entries: [
    {
      find: "./azure-buffer.utils.node",
      replacement: "./azure-buffer.utils.browser",
    },
  ],
});

export default [
  {
    input: "./src/index.ts",
    output: {
      format: "cjs",
      file: "dist/index.node.cjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.ts",
    output: {
      format: "es",
      file: "dist/index.node.mjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.ts",
    output: {
      format: "cjs",
      file: "dist/index.browser.cjs",
    },
    plugins: [browserAliasPlugin, typescript()],
  },
  {
    input: "./src/index.ts",
    output: {
      format: "es",
      file: "dist/index.browser.mjs",
    },
    plugins: [browserAliasPlugin, typescript()],
  },
  {
    input: "./src/index.ts",
    output: {
      file: "dist/index.d.ts",
    },
    plugins: [dts()],
  },
];
