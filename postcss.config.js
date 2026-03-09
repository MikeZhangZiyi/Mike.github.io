module.exports = {
  plugins: [
    require('postcss-import')({
      path: ["node_modules"] 
    }),
    require('postcss-nesting'),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
  ]
};