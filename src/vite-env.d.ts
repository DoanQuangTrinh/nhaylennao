/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.css?url" {
  const href: string;
  export default href;
}
