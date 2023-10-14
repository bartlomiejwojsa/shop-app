import { config as configDotenv } from 'dotenv';
import { resolve } from 'path';

switch (process.env.NODE_ENV) {
  case 'development':
    console.log("Environment is 'development'");
    configDotenv({
      // eslint-disable-next-line no-undef
      path: resolve(__dirname, '../.env.development')
    });
    break;
  case 'production':
    console.log("Environment is 'production'");
    configDotenv({
      // eslint-disable-next-line no-undef
      path: resolve(__dirname, '../.env.production')
    });
    break;
  // Add 'staging' and 'production' cases here as well!
  default:
    throw new Error(`'NODE_ENV' ${process.env.NODE_ENV} is not handled!`);
}

const throwIfNot = function <T, K extends keyof T>(
  obj: Partial<T>,
  prop: K,
  msg?: string
): T[K] {
  if (obj[prop] === undefined || obj[prop] === null) {
    throw new Error(
      msg || `Environment is missing variable ${String(prop)}`
    );
  } else {
    return obj[prop] as T[K];
  }
};

// Validate that we have our expected ENV variables defined!
[
  'MONGO_USER',
  'MONGO_PASSWORD',
  'MONGO_URI_PREFIX',
  'MONGO_URI_POSTFIX',
  'MONGO_SESSION_KEY',
  'PORT',
  'MAIL_SENDER',
  'MAIL_SECRET',
  'IS_GLITCH_SERVER',
  'JWT_SECRET_KEY',
].forEach((v) => {
  throwIfNot(process.env, v);
});

// eslint-disable-next-line no-unused-vars
declare namespace NodeJS {
  export interface ProcessEnv {
    MONGO_USER: string;
    MONGO_PASSWORD: string;
    MONGO_URI_PREFIX: string;
    MONGO_URI_POSTFIX: string;
    MAIL_SENDER: string;
    MAIL_SECRET: string;
    PORT: string;
    IS_GLITCH_SERVER: string;
    JWT_SECRET_KEY: string;
  }
}
