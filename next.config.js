/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Find the rule that handles CSS files
    const cssRule = config.module.rules.find(
      (rule) => rule.oneOf && rule.oneOf.some((r) => r.test && r.test.toString().includes('css'))
    );

    if (cssRule && cssRule.oneOf) {
      // Find the PostCSS loader in the CSS rule
      cssRule.oneOf.forEach((rule) => {
        if (rule.use && Array.isArray(rule.use)) {
          // Remove the PostCSS loader
          rule.use = rule.use.filter(
            (loader) => !(loader.loader && loader.loader.includes('postcss-loader'))
          );
        }
      });
    }

    return config;
  },
};

module.exports = nextConfig; 