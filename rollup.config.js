import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    sourcemap: 'inline'
  },
  plugins: [nodeResolve({
    browser: true,
    preferBuiltins: false
  })]
};