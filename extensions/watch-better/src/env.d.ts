interface ImportMetaEnv {
  readonly VITE_EMAIL_COLLECTOR_URL?: string;
}

declare module '*.png?inline' {
  const url: string;
  export default url;
}
