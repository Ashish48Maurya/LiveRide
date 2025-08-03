const { Kafka } = require('kafkajs')

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT || 'my-app',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
})

module.exports = kafka;