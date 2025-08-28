const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const autoprefixer = require("autoprefixer");

const devMode = process.env.NODE_ENV !== "production";
const prodMode = process.env.NODE_ENV === "production";
const environment = prodMode ? "production" : "development";
const logLevel = process.env.REACT_LOG_LEVEL || (prodMode ? "warn" : "debug");
const reactEnvVariables = new webpack.DefinePlugin({
  ["process.env.REACT_LOG_LEVEL"]: JSON.stringify(`${logLevel}`),
});
console.log("****************** building client ******************")
console.log(`application entry : [${path.resolve(__dirname, "../digital-form-builder/designer/client", "index.tsx")}]\n`)
console.log(`adapter application entry : [${path.resolve(__dirname, "client", "index.tsx")}]\n`)
console.log(`application output : [${path.resolve(__dirname, "dist", "client")}]\n`)
console.log(`application node_modules : [${path.resolve(__dirname, "../digital-form-builder/node_modules")}]\n`)
console.log(`adapter application node_modules : [${path.resolve(__dirname, "../digital-form-builder-adapter/node_modules")}\n]`)

function fixGovukImports(url /*, prev */) {
  const n = url.replace(/\\/g, "/");
  const m = n.match(/(?:^|\/)node_modules\/govuk-frontend\/(.+)$/);
  if (m) {
    const suffix = m[1];
    if (
      suffix === "govuk/helpers/colour" ||
      suffix === "govuk/helpers/_colour.scss"
    ) {
      return {
        file: require.resolve("govuk-frontend/govuk/helpers/_colour.scss"),
      };
    }
    if (suffix === "govuk/all.scss" || suffix === "govuk/all") {
      return { file: require.resolve("govuk-frontend/govuk/all.scss") };
    }
    return {
      file: path.join(
        path.dirname(require.resolve("govuk-frontend/package.json")),
        suffix
      ),
    };
  }
  return null;
}

const client = {
  target: "web",
  mode: environment,
  watch: devMode,
  entry: {
    "digital-form-builder": path.resolve(__dirname, "../digital-form-builder/designer/client", "index.tsx"),
    "digital-form-builder-adapter": path.resolve(__dirname, "client", "index.tsx")
  },
  output: {
    path: path.resolve(__dirname, "dist", "client"),
    filename: "assets/[name].js",
    publicPath: "",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: ["node_modules"],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
    },
  },
  devtool: "eval-cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: (modulePath) =>
          /node_modules/.test(modulePath) && !/node_modules[\\/](pino)/.test(modulePath),
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "../../",
            },
          },
          {
            loader: "css-loader",
            options: {},
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [autoprefixer()],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
              sassOptions: {
                outputStyle: "expanded",
                importer: fixGovukImports,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif|ico)$/,
        loader: "file-loader",
        options: {
          name: "assets/images/[name].[ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        loader: "file-loader",
        options: {
          name: "assets/fonts/[name].[ext]",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../digital-form-builder/designer/server", "views", "layout.html"),
      filename: "views/layout.html",
      minify: prodMode,
      scriptLoading: "defer",
      inject: "head",
      hash: prodMode,
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? "assets/css/[name].css" : "assets/css/[name].[contenthash].css",
      chunkFilename: devMode ? "assets/css/[id].css" : "assets/css/[id].[contenthash].css",
    }),
    new CopyPlugin({
      patterns: [
        {from: "../designer/client/i18n/translations", to: "assets/translations"},
        {from: "../designer/server/views", to: "views"},
      ],
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      defaultSizes: "gzip",
      openAnalyzer: false,
    }),
    reactEnvVariables,
  ],
  externals: {},
};
console.log("****************** building server ******************")
const server = {
  target: "node",
  mode: environment,
  watch: devMode,
  entry: path.resolve(__dirname, "../designer/server", "index.ts"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "server.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: ["node_modules"],
  },
  node: {
    __dirname: false,
  },
  watchOptions: {
    poll: 1000, // enable polling since fsevents are not supported in docker
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  externals: [
    nodeExternals(),
    { fsevents: "commonjs fsevents" },
  ],
};

module.exports = [client, server];
