const Babel = require("@babel/core");

module.exports = [
  {
    ext: ".ts",
    transform: (content, filename) => {
      const result = Babel.transformSync(content, {
        filename,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ]
      });
      return result.code;
    }
  }
];