"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCronLock = void 0;
const ioredis_1 = require("ioredis");
const config_1 = require("../constants/config");
const redis = new ioredis_1.default({
    host: config_1.config.redis.host,
    port: config_1.config.redis.port,
    password: config_1.config.redis.password,
    db: config_1.config.redis.db,
});
const withCronLock = async (key, ttlMs, fn) => {
    const lockVal = `${process.pid}:${Date.now()}`;
    const ok = await redis.set(key, lockVal, 'PX', ttlMs, 'NX');
    if (!ok)
        return;
    try {
        await fn();
    }
    finally {
        const lua = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end
      return 0
    `;
        await redis.eval(lua, 1, key, lockVal);
    }
};
exports.withCronLock = withCronLock;
//# sourceMappingURL=cron-lock.js.map