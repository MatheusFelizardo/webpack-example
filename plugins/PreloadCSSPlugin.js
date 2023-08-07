/**
 * https://webpack.js.org/api/compiler-hooks/
 * https://webpack.js.org/plugins/html-webpack-plugin
 * 
 * Combine webpack compiler hooks and HtmlWebpackPlugin to manipulate the HTML file 
 * and add the preload attribute to the CSS files.
 * 
 * To test the effect better add "Slow connection" in network tab of the browser.
 * 
 * This plugin was created by Matheus Felizardo (https://github.com/MatheusFelizardo)
 * Created 07/08/2023
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');

class PreloadCSSPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('PreloadCSSPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('PreloadCSSPlugin', (data, callback) => {
          const cssFiles = data.assetTags.styles.map((tag) => {
            const object = {
              ...tag,
              attributes: {
                rel: 'preload',
                as: 'style',
                href: tag.attributes.href,
                onload: "this.onload=null;this.rel='stylesheet'"
              }
            }
            return object
          });
          data.assetTags.styles = cssFiles;
          callback(null, data);
        }
      );
    });
  }
}

module.exports = PreloadCSSPlugin;
