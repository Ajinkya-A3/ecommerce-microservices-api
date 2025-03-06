const amqp = require("amqplib");

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        console.log("✅ Connected to RabbitMQ");
        return channel;
    } catch (error) {
        console.error("❌ RabbitMQ Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectRabbitMQ;
