import Redis from 'ioredis';

// Extract Redis client creation to reduce complexity
function createRedisClient() {
    const {
        FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI: redisUri,
        REDIS_HOST: redisHost,
        REDIS_PORT: redisPort,
        REDIS_PASSWORD: redisPassword,
        REDIS_TLS: redisTls,
    } = process.env;

    if (!redisUri && !redisHost) {
        console.error("Error: Redis connection details (REDIS_HOST or FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI) not found in environment variables.");
        process.exit(1);
    }

    const redisOptions = {};
    if (redisPassword) redisOptions.password = redisPassword;
    if (redisTls === 'true') redisOptions.tls = {};

    const client = redisUri ? new Redis(redisUri, redisOptions) : new Redis({
        host: redisHost,
        port: redisPort,
        ...redisOptions
    });

    client.on('error', err => console.error('Redis Client Error', err));

    return client;
}

// Extract key processing logic to reduce complexity
async function processKey(client, key) {
    const parts = key.split(':');

    // Process only old keys, which have 3 parts like 'forms:cache:form-id'
    if (parts.length !== 3) {
        return false;
    }

    const formId = parts[2];
    const value = await client.get(key);

    if (!value) {
        return false;
    }

    const permanentKey = `forms:cache:permanent:${formId}`;
    const previewKey = `forms:cache:preview:${formId}`;

    console.log(`Migrating key: ${key} -> ${permanentKey} and ${previewKey}`);
    
    await client.set(permanentKey, value);
    await client.set(previewKey, value);
    
    return true;
}

// Main migration logic
async function migrateKeys(client) {
    const sourcePattern = 'forms:cache:*';
    let cursor = '0';
    let migratedCount = 0;

    console.log(`Scanning for keys matching "${sourcePattern}"...`);

    do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', sourcePattern);

        for (const key of keys) {
            const migrated = await processKey(client, key);
            if (migrated) {
                migratedCount++;
            }
        }
        
        cursor = nextCursor;
    } while (cursor !== '0');

    return migratedCount;
}

// Top-level await execution
console.log("Starting Redis key migration script...");

const client = createRedisClient();

try {
    const migratedCount = await migrateKeys(client);
    console.log(`\nMigration complete. Successfully migrated ${migratedCount} keys.`);
} catch (error) {
    console.error("An error occurred during migration:", error);
} finally {
    client.quit();
}