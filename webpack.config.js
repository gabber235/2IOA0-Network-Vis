const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const EncodingPlugin = require('webpack-encoding-plugin');

module.exports = {
    entry: ['./src/index.ts', './resources/scss/stylesheet.scss'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: 'css/[name].css',
                        minimize: true,
                        sourceMap: true,
                        publicPath: '../',
                        useRelativePaths: true
                    }
                },
                    "extract-loader",
                    "css-loader",
                    "sass-loader",
                ]
            },
            {
                test: /\.(png|jpg|gif|wav|ogg)$/,
                loader: 'file-loader',
            }
        ],
    },
    devServer: {
        contentBase: './dist',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            inject: 'body'
        }),
        new EncodingPlugin({
            encoding: 'utf-16'
        })
    ],
    cache: {
        type: 'memory'
    },
    target: "web",
};