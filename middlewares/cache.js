const redis = require('../utils/redis');

async function cache(key, ttl, fetcher) {
    try {
        const cached = await redis.get(key);
        if (cached) {
            return {
                data: JSON.parse(cached),
                cached: true
            };
        }

        if (typeof fetcher === 'function') {
            const data = await fetcher();
            await redis.set(key, JSON.stringify(data), 'EX', ttl);
            return {
                data,
                cached: false
            };
        }

        return { data: null, cached: false };

    } catch (error) {
        console.error('Cache error:', error);
        return {
            data: null,
            cached: false
        };
    }
}

module.exports = cache;
