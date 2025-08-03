const kafka = require('./index');
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'group-1' });
const Location = require('../models/location');

const BATCH_SIZE = process.env.B_SIZE || 3;
const FLUSH_INTERVAL_MS = process.env.F_INTERVAL || 2000;

// BATCH_SIZE: Number of messages to accumulate before writing to the database in one go.
// FLUSH_INTERVAL_MS: Maximum wait time (in milliseconds) to flush the buffer, even if the batch isn't full.

let messageBuffer = [];

async function flushBuffer() {
  if (messageBuffer.length === 0) return;

  const batch = [...messageBuffer];
  messageBuffer = [];
  try {
    await Location.insertMany(batch, { ordered: false });
    console.log(`Inserted batch of ${batch.length} locations`);
  } catch (err) {
    console.error('Bulk insert failed:', err);
  }
}

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC || 'rider-location-updates', fromBeginning: false });

  // setInterval(flushBuffer, FLUSH_INTERVAL_MS); //this will flush the msg if buffer size is less than BATCH_SIZE : in case of lower traffic

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { latitude, longitude } = JSON.parse(message.value.toString());
        const id = message.key.toString();
        messageBuffer.push({
          riderId: id,
          latitude,
          longitude,
        });

        if (messageBuffer.length >= BATCH_SIZE) {
          await flushBuffer();
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    },
  });
}

module.exports = run;
