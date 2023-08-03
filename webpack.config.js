const path = require('path');
const fs = require('fs');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const inquirer = require('inquirer');
const { jsParser } = require('./tasks/jsParser');
const { sassParser } = require('./tasks/sassParser');

const isProduction = process.env.NODE_ENV === 'production';

const questions = [
  {
    type: 'list',
    name: 'option',
    message: 'Please select the option you want to run: ',
    choices: ['option1', 'option2'],
  },
];

// We create a promise to wait for the user response to run the webpack
function promptAsync(questions) {
    return new Promise((resolve) => {
      inquirer.prompt(questions).then(resolve);
    });
  }


function createConfig(selectedOption) {
  console.log(`Selected option: ${selectedOption} \nPlease wait... \n`);

  const jsPath = path.resolve(__dirname, 'src', 'js', selectedOption)
  const scssPath = path.resolve(__dirname, 'src', 'scss', selectedOption)

  // Just in case you add an option to promp that doesn't exist
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
            minify: true,
            inject: true
        }),
        new MiniCssExtractPlugin({
            filename: `css/${selectedOption}.css`,
        }),
    ],
    module: {
      rules: [
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
    const selectedConfig = createConfig(selectedOption);
  
    return selectedConfig;
  };