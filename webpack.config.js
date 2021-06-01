const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const EncodingPlugin = require('webpack-encoding-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = {
    entry: {
        landing: './src/landing.ts',
        landingScss: './resources/scss/landing.scss',
        vis: './src/vis.ts',
        visScss: './resources/scss/vis.scss',
        about: './src/about.ts',
        aboutScss: './resources/scss/about.scss',
    },
    output: {
        // filename: 'bundle.js',
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
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpg)$/,
                use: 'file-loader?name=resources/static/[name].[ext]',
            },
            {
                test: /\.(csv|riv)$/,
                loader: 'file-loader',
            },
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
            template: "./vis.html",
            filename: "vis.html",
            chunks: ['vis']
        }),
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
            chunks: ['landing']
        }),
        new HtmlWebpackPlugin({
            template: "./about.html",
            filename: "about.html",
            chunks: ['about']
        }),
        new EncodingPlugin({
            encoding: 'utf-16'
        }),
        new FaviconsWebpackPlugin({
            logo: './resources/static/logo.png',
            favicons: {
                appName: 'CoVis19',
                appDescription: 'Visualize Enron dataset',
                developerName: 'Gabber235',
                developerURL: null, // prevent retrieving from the nearest package.json
                background: '#ffffff',
                theme_color: '#4cdf8e',
                icons: {
                    android: true, // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    coast: true, // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    favicons: true, // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    firefox: true, // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    windows: true, // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                    yandex: true, // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
                }
            },
        }),
    ],
    cache: {
        type: 'memory'
    },
    target: "web",
};