const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const plugins = [new ForkTsCheckerWebpackPlugin()];

const assets = ['static'];
const copyPlugins = assets.map((asset) => {
    return new CopyWebpackPlugin({
        patterns: [{ from: path.resolve(__dirname, 'src', asset), to: asset }],
    });
});
plugins.push(...copyPlugins);

module.exports = plugins;
