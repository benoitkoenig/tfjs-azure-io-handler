import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: "./src/index.node.ts",
    output: {
      format: "cjs",
      file: "dist/index.node.cjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.node.ts",
    output: {
      format: "es",
      file: "dist/index.node.mjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.browser.ts",
    output: {
      format: "cjs",
      file: "dist/index.browser.cjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.browser.ts",
    output: {
      format: "es",
      file: "dist/index.browser.mjs",
    },
    plugins: [typescript()],
  },
  {
    input: "./src/index.node.ts",
    output: {
      file: "dist/index.d.ts",
    },
    plugins: [dts()],
  },
];
