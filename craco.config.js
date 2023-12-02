// craco.config.js
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    webpack: {
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: "./node_modules/primereact/resources/themes/soho-light/theme.css", to: "./static/css/soho-light.css" },
                    { from: "./node_modules/primereact/resources/themes/soho-dark/theme.css", to: "./static/css/soho-dark.css" },
                ],
            }),
        ],
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ]
    }
}