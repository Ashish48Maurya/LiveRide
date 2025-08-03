const kafka = require('./index');
const producer = kafka.producer();
async function run(key, data) {
    await producer.connect();
    console.log(`Producing message with key ${key}:`, data);
    await producer.send({
        topic: process.env.KAFKA_TOPIC || "rider-location-updates",
        messages: [
            { key, value: JSON.stringify(data) },
        ],
    });
    await producer.disconnect();
}
module.exports = run;