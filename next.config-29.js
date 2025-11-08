/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para export estático (Hostinger hospedagem compartilhada)
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Remove configurações que não funcionam com export estático
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig