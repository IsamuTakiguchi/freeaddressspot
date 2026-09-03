import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railwayでは standalone 出力を node で直接起動する（Dockerfile参照）
  output: "standalone",
  // pg はNode専用パッケージのためバンドルせず外部参照にする
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      // フロア図面画像のアップロード（server action / FormData）用
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
