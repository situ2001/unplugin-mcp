import path from 'path';
import { webpackPlugin as mcp } from 'unplugin-mcp';
import { ModuleTool, BuildConfigTool, BuildErrorTool } from 'unplugin-mcp/tools';

const __dirname = import.meta.dirname;

export default {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'module'
  },
  experiments: {
    outputModule: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx','.ts','.js']
  },
  plugins: [
    mcp({
      provideUnpluginMcpTools: () => [
        new BuildErrorTool(),
        // new ModuleTool(),
        // new BuildConfigTool(),
      ]
    })
  ]
};
