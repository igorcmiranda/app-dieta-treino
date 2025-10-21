/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover output: 'export' para desenvolvimento
  // output: 'export', // Descomentado apenas para build de produção
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;