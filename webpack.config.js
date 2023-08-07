const path = require('path');
const fs = require('fs');

// webpack plugins
const HtmlWebpackPlugin = require('html-webpack-plugin'); // https://webpack.js.org/plugins/html-webpack-plugin/
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // https://webpack.js.org/plugins/mini-css-extract-plugin/
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // https://webpack.js.org/plugins/clean-webpack-plugin/
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin'); // https://webpack.js.org/plugins/image-minimizer-webpack-plugin/
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin"); // https://webpack.js.org/plugins/css-minimizer-webpack-plugin/
const CopyPlugin = require('copy-webpack-plugin'); // https://webpack.js.org/plugins/copy-webpack-plugin/
const TerserPlugin = require('terser-webpack-plugin'); // https://webpack.js.org/plugins/terser-webpack-plugin/

// custom plugins
const PreloadCSSPlugin = require('./plugins/PreloadCSSPlugin'); 

// third party libraries
const inquirer = require('inquirer'); // https://www.npmjs.com/package/inquirer

// tasks
const { jsParser } = require('./tasks/jsParser');
const { sassParser } = require('./tasks/sassParser');

const isProduction = process.env.NODE_ENV === 'production';

const questions = [
  {
    type: 'list',
    name: 'option',
    message: 'Please select the option you want to run: ',
    choices: [ 
      { name: "[1] DoubleClick Campaign Manager - Includes Click Tag Links", value: "option1" },
      { name: "[2] DoubleClick Studio - Includes Enabler.js and Exit Links", value: "option2" }
    ]
  },
  {
    type: 'list',
    name: 'preload',
    message: 'Use pre-load css?',
    choices: [ 
      { name: "[1] Yes", value: true },
      { name: "[2] No", value: false }
    ]
  },
  {
    type: 'list',
    name: 'minify',
    message: 'Minify files?',
    choices: [ 
      { name: "[1] Yes", value: true },
      { name: "[2] No", value: false }
    ]
  },
];

// We create a promise to wait for the user response to run the webpack
function promptAsync(questions) {
    return new Promise((resolve) => {
      inquirer.prompt(questions).then(resolve);
    });
  }


function createConfig(selectedOption, selectedPreload, selectedMinify) {
  // const selectedText = questions[0].choices.find(choice => choice.value === selectedOption).name;
  // console.log(`Selected option: ${selectedText} \nPlease wait... \n`);
  console.log(`\nPlease wait... \n`);

  const jsPath = path.resolve(__dirname, 'src', 'js', selectedOption)
  const scssPath = path.resolve(__dirname, 'src', 'scss', selectedOption)

  // Just in case you add an option to promp that doesn't exist, like { name: "[3] Example text", value: "option3" }
  // There is no option3 folder, so we need to check if the path exists
  
  const isJsPathValid = fs.existsSync(jsPath) 
  const isScssPathValid = fs.existsSync(scssPath);
  
  if (!isJsPathValid) {
    console.error(`Invalid path: ${jsPath}`);
    process.exit(1);
  }
    
  if (!isScssPathValid) {
    console.error(`Invalid path: ${scssPath}`);
    process.exit(1);
  }

  const imagesPath = path.resolve(__dirname, 'src', 'img', selectedOption);
  const imagesOutputPath = path.resolve(__dirname, 'dist', 'img', selectedOption);

  const config = {
    entry: [
        ...jsParser(jsPath),
        ...sassParser(scssPath)
    ],  
    output: {
        filename: `js/${selectedOption}.js`,
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: `./src/html/${selectedOption}/index.html`,
            filename: `index.html`,
            minify: selectedMinify,
            inject: true
        }),
        new MiniCssExtractPlugin({
            filename: `css/${selectedOption}.css`,
            // filename: `css/${selectedOption}.[contenthash].css` // Enable unique hash for file and cash busting for css files by webpack
        }),
        new ImageMinimizerPlugin({
          test: /\.(jpe?g|png|gif|svg)$/i,
          include: imagesPath,
          minimizer: {
            implementation: ImageMinimizerPlugin.squooshMinify,
            options: {},
          },
        }),
        new CopyPlugin({
          patterns: [
            {
              from: imagesPath,
              to: imagesOutputPath, // Processed images will be copied to this path
              globOptions: {
                ignore: ['*.DS_Store'], 
              },
            },
          ],
        }),
        selectedPreload ? new PreloadCSSPlugin() : null, 
    ],
    module: {
      rules: [
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          type: "asset",
        },
        {
            test: /\.s[ac]ss$/i,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                'sass-loader'
            ],
        },
      ],
    },
    optimization: {
      minimizer: [
        selectedMinify ? new CssMinimizerPlugin() : null, // responsible for minifying the css
        selectedMinify ? new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.squooshMinify
          },
        }) : null, // responsible for minifying the images
        selectedMinify ? new TerserPlugin({
          terserOptions: {
            format: {
              comments: false, 
            },
          },
        }) : null, // responsible for minifying the js
      ],
    },
    mode: isProduction ? 'production' : 'development',
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        }, 
        watchFiles: [path.resolve(__dirname, 'src', `html/${selectedOption}`, '**', '*.html')],
    },
  };

  return config;
}

module.exports = async (env) => {
    const answers = await promptAsync(questions);
    // After the promise is resolved, we continue the execution
    const selectedOption = answers.option;
    const selectedPreload = answers.preload;
    const selectedMinify = answers.minify;
    const selectedConfig = createConfig(selectedOption, selectedPreload, selectedMinify);
  
    return selectedConfig;
  };