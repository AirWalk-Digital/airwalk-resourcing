const isProd = process.env.NODE_ENV === 'production';
console.log(isProd);

module.exports = {
  output: 'standalone',
  basePath: '/resourcing',
  // async rewrites() {
  //     return {
  //         beforeFiles: [
  //             {
  //                 source: '/',
  //                 destination: '/resourcing',
  //             },
  //             {
  //                 source: '/:slug*',
  //                 destination: '/resourcing/:slug*', // Matched parameters can be used in the destination
  //             },
  //         ],
  //     };
  // },
  // Use the CDN in production and localhost for development.
  assetPrefix: isProd ? '/resourcing' : undefined,
};
