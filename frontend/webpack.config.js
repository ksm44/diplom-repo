const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: 'development',

  entry: "./src/main.jsx", // точка входа

  output: { // настройки того, куда и как класть результат сборки
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    clean: true, // перед сборкой очищать папку dist от старых файлов
    publicPath: "/",
  },

  devServer: {
    port: 3000, //куда стучаться во front-end (куда направлять запросы)
    historyApiFallback: true, // для SPA: все неизвестные пути → index.html
    hot: true,
    proxy: [{ context: ["/api", "/static"],
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: { "^/api": "" } // например при обращении в /api/movies попадём в /movies на бэкенде
    }], //куда перенаправит запрос
  },

  module: { // правила обработки разных типов файлов
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, use: "babel-loader" }, // .js/.jsx → babel-loader; без node_modules
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.(png|jpg|svg)$/, type: "asset/resource" },
    ],
  },

  resolve: { extensions: [".js", ".jsx"] },

  plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html", // исходный HTML-шаблон, который берётся за основу
      })
  ],

};