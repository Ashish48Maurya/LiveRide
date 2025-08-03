require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const hbs = require('hbs');
const { Server } = require('socket.io');
const consumer = require('./src/kafka/consumer');
const producer = require('./src/kafka/producer');
const mongoConnect = require('./src/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('rider:locationUpdate', (data) => {
        const { latitude, longitude } = data;

        io.emit('rider:locationBroadcast', {
            id: socket.id,
            latitude,
            longitude,
        });

        producer(socket.id, { latitude, longitude });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        socket.broadcast.emit('rider:disconnected', { id: socket.id });
    });
});

consumer().catch(console.error);

server.listen(PORT, () => {
    const connection = mongoConnect(process.env.MONGO_URL || 'mongodb://localhost:27017/rider-location');
    if (connection) {
        console.log('Connected to MongoDB');
    } else {
        console.error('Failed to connect to MongoDB');
    }
    console.log(`Server running on port ${PORT}`);
});