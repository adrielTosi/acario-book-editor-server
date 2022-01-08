declare namespace NodeJS {
  interface ProcessEnv {
    COOKIE_NAME: string;
    SESSION_SECRET: string;
    CLIENT_URL: string;
    REDIS_URL: string;
    PORT: string;
    DATABASE_URL: string;
  }
}