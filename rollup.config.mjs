import alias from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

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
    plugins: [
      alias({
        entries: [
          {
            find: "./azure-buffer.utils.node",
            replacement: "./azure-buffer.utils.browser",
          },
        ],
      }),
      typescript(),
    ],
  },
  {
    input: "./src/index.ts",
    output: {
      format: "es",
      file: "dist/index.browser.mjs",
    },
    plugins: [
      alias({
        entries: [
          {
            find: "./azure-buffer.utils.node",
            replacement: "./azure-buffer.utils.browser",
          },
        ],
      }),
      typescript(),
    ],
  },
  {
    input: "./src/index.ts",
    output: {
      file: "dist/index.d.ts",
    },
    plugins: [dts()],
  },
];
