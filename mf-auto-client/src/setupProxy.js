// // src/setupProxy.js
// const { createProxyMiddleware } = require('http-proxy-middleware');

// module.exports = function(app) {
//   app.use(
//     '/auth',
//     createProxyMiddleware({
//       target: 'https://server.mfautosfinance.com',
//       changeOrigin: true,
//       secure: false,
//     })
//   );
  
//   app.use(
//     '/api',
//     createProxyMiddleware({
//       target: 'https://server.mfautosfinance.com',
//       changeOrigin: true,
//       secure: false,
//     })
//   );
// };