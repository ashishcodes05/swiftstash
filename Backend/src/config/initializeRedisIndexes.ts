type RedisIndexFieldType = "TAG" | "TEXT";

type RedisSearchClient = {
    ft: {
        info: (index: string) => Promise<unknown>;
        create: (
            index: string,
            schema: Record<string, { type: RedisIndexFieldType; AS: string; SORTABLE?: true }>,
            options: { ON: "JSON"; PREFIX: string },
        ) => Promise<unknown>;
    };
};

const SESSION_INDEX = "sessionIdx";
const SESSION_PREFIX = "swiftstash:session:";
const SESSION_SCHEMA = {
    "$.userId": { type: "TAG", AS: "userId" },
    "$.createdAt": { type: "TEXT", AS: "createdAt", SORTABLE: true },
} as const;
const SESSION_INDEX_OPTIONS = {
    ON: "JSON",
    PREFIX: SESSION_PREFIX,
} as const;

const initializationPromises = new WeakMap<object, Promise<void>>();

const toRecord = (value: unknown): Record<string, unknown> => {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries());
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
};

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry).toUpperCase());
};

const getMismatch = (infoValue: unknown): string | undefined => {
    const info = toRecord(infoValue);
    if (info.index_name !== SESSION_INDEX) {
        return `index name must be ${SESSION_INDEX}`;
    }

    const definition = toRecord(info.index_definition);
    if (String(definition.key_type).toUpperCase() !== "JSON") {
        return "index must use JSON documents";
    }

    const prefixes = Array.isArray(definition.prefixes)
        ? definition.prefixes.map(String)
        : [];
    if (prefixes.length !== 1 || prefixes[0] !== SESSION_PREFIX) {
        return `index prefix must be exactly ${SESSION_PREFIX}`;
    }

    if (!Array.isArray(info.attributes) || info.attributes.length !== 2) {
        return "index must contain exactly the userId and createdAt fields";
    }

    const fields = new Map<string, Record<string, unknown>>();
    for (const attribute of info.attributes) {
        const field = toRecord(attribute);
        fields.set(String(field.attribute ?? ""), field);
    }

    const userId = fields.get("userId");
    if (!userId || userId.identifier !== "$.userId" || String(userId.type).toUpperCase() !== "TAG") {
        return "userId must map from $.userId as a TAG field";
    }
    if (asStringArray(userId.flags).includes("SORTABLE")) {
        return "userId must not be configured as SORTABLE";
    }

    const createdAt = fields.get("createdAt");
    if (!createdAt || createdAt.identifier !== "$.createdAt" || String(createdAt.type).toUpperCase() !== "TEXT") {
        return "createdAt must map from $.createdAt as a TEXT field";
    }
    if (!asStringArray(createdAt.flags).includes("SORTABLE")) {
        return "createdAt must be SORTABLE";
    }

    return undefined;
};

const errorDescription = (error: unknown): string => {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    return String(error);
};

const isIndexNotFound = (error: unknown): boolean =>
    /SEARCH_INDEX_NOT_FOUND|unknown\s+index|index\s+not\s+found/i.test(errorDescription(error));

const isAlreadyExists = (error: unknown): boolean =>
    /SEARCH_INDEX_ALREADY_EXISTS|index\s+already\s+exists/i.test(errorDescription(error));

const validateSessionIndex = async (client: RedisSearchClient): Promise<void> => {
    const info = await client.ft.info(SESSION_INDEX);
    const mismatch = getMismatch(info);
    if (mismatch) {
        throw new Error(`Redis index ${SESSION_INDEX} has an incompatible schema: ${mismatch}`);
    }
};

const ensureSessionIndex = async (client: RedisSearchClient): Promise<void> => {
    try {
        await validateSessionIndex(client);
        return;
    } catch (error) {
        if (!isIndexNotFound(error)) throw error;
    }

    try {
        await client.ft.create(SESSION_INDEX, SESSION_SCHEMA, SESSION_INDEX_OPTIONS);
    } catch (error) {
        if (!isAlreadyExists(error)) throw error;
        // Another process may have created the index after our initial FT.INFO.
    }

    await validateSessionIndex(client);
};

export const initializeRedisIndexes = (client: RedisSearchClient): Promise<void> => {
    const clientKey = client as object;
    const existingAttempt = initializationPromises.get(clientKey);
    if (existingAttempt) return existingAttempt;

    let trackedAttempt: Promise<void>;
    trackedAttempt = ensureSessionIndex(client).catch((error: unknown) => {
        if (initializationPromises.get(clientKey) === trackedAttempt) {
            initializationPromises.delete(clientKey);
        }
        throw error;
    });
    initializationPromises.set(clientKey, trackedAttempt);
    return trackedAttempt;
};
