/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Silence optional React Native async-storage resolution in MetaMask SDK
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    return config;
  },
};

export default nextConfig;
