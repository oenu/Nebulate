const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "..", "src");
const outputPath = path.join(__dirname, "../dist");

module.exports = {
  entry: {
    popup: path.join(srcDir, "popup.tsx"),
    options: path.join(srcDir, "options.tsx"),
    background: path.join(srcDir, "background.ts"),
    content_script: path.join(srcDir, "content_script.tsx"),
  },
  output: {
    path: path.join(outputPath, "js"),
    filename: "[name].js",
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    // Copy the public directory to the dist directory (except the manifest.json file)
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, "..", "..", "public"),
          to: outputPath,
          filter: (resourcePath) => {
            return (
              resourcePath !==
              path.join(__dirname, "..", "..", "public", "manifest.json")
            );
          },
        },
      ],
    }),
    // Copy the manifest.json file from the parent directory to the dist directory
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, "../manifest.json"),
          to: outputPath,
        },
      ],
    }),
  ],
};
