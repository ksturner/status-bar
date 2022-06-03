const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const webpack = require('webpack');

rules.push({
    test: /\.css$/,
    use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
        { loader: 'postcss-loader' },
    ],
});
plugins.push(new webpack.ExternalsPlugin('commonjs', ['electron']));

module.exports = {
    module: {
        rules,
    },
    // target: 'electron-renderer', // this one breaks react w/ webpack
    plugins: plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    },
    externals: {
        canvas: '{}',
    },
};
