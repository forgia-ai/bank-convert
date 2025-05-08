/* eslint-disable */
import path from "path"
import pino from "pino"

/* IMPORTANT:
 * To get this to work properly, must edit `next.config.ts` to add the following lines:
 * const nextConfig: NextConfig = {
 *  serverExternalPackages: ["pino", "pino-pretty"],
 *  webpack: (config) => {
 *    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
 *    return config
 *  },
 * }
 */

const isDev = process.env.NODE_ENV !== "production"
const isNotEdge = process.env.NEXT_RUNTIME !== "edge"

// Create logger configuration
const config =
  isDev && isNotEdge
    ? {
        level: "debug",
        transport: {
          // //   Pino-pretty
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss", // Human-readable timestamp
            ignore: "pid,hostname", // Optional: Skip unnecessary fields
          },

          // Save logs to file
          //   target: "pino/file",
          //   options: {
          //     destination: path.join(process.cwd(), "app.log"),
          //     mkdir: true,
          //     ignore: "pid,hostname", // Optional: Skip unnecessary fields
          //   },
        },
      }
    : {
        level: process.env.LOG_LEVEL || "debug",
        base: {
          env: process.env.NODE_ENV,
        },
      }

export const logger = pino(config)
