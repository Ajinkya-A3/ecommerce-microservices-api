const amqp = require("amqplib");
const connectRabbitMQ = require("../config/rabbitMQ");

async function publishMessage(queue, message) {
    const channel = await connectRabbitMQ();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`📩 Sent message to queue: ${queue}`);
}

module.exports = { publishMessage };
