import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => {
    console.log("Error in connecting to Redis", err);
})

redisClient.on("ready", () => {
    console.log("Connected to Redis database");
});

await redisClient.connect();

export default redisClient;