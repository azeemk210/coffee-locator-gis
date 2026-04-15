/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure CSS is properly processed
  compiler: {
    // Disable SWC minification for CSS to allow PostCSS to work
    styledComponents: true,
  },
}

module.exports = nextConfig
