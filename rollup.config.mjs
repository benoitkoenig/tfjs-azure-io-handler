import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

const baseConfig = {
  input: "./src/index.ts",
  external: ["@azure/storage-blob", "@tensorflow/tfjs-core"],
};

/** This plugin ensures that the browser build imports browser files */
const browserAliasPlugin = alias({
  entries: [
    {
      find: "./azure-buffer.utils.node",
      replacement: "./azure-buffer.utils.browser",
    },
  ],
});

const typescriptPlugin = typescript();

export default [
  {
    ...baseConfig,
    output: {
      format: "cjs",
      file: "dist/index.node.cjs",
    },
    plugins: [typescriptPlugin],
  },
  {
    ...baseConfig,
    output: {
      format: "es",
      file: "dist/index.node.mjs",
    },
    plugins: [typescriptPlugin],
  },
  {
    ...baseConfig,
    output: {
      format: "cjs",
      file: "dist/index.browser.cjs",
    },
    plugins: [browserAliasPlugin, typescriptPlugin],
  },
  {
    ...baseConfig,
    output: {
      format: "es",
      file: "dist/index.browser.mjs",
    },
    plugins: [browserAliasPlugin, typescriptPlugin],
  },
  {
    ...baseConfig,
    output: {
      file: "dist/index.d.ts",
    },
    plugins: [dts()],
  },
];
