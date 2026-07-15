const fmt = (level: string, tag: string, msg: string) => `[${new Date().toISOString()}] [${level.toLocaleUpperCase()}] [${tag.padStart(12)}] ${msg}`;
export const logger = {
    info: (tag: string, msg: string) => console.log(fmt('info', tag, msg)),
    warn: (tag: string, msg: string) => console.warn(fmt('warn', tag, msg)),
    error: (tag: string, msg: string, error?: Error) => {
        console.error(fmt('error', tag, msg));
        if (error?.stack) console.error(error.stack);
    }
};