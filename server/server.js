const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://withyou.vercel.app", "http://localhost:5173"], // Ajusta esto a los orígenes de tus clientes
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

app.use(cors({
  origin: ["https://withyou.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["my-custom-header"],
  credentials: true
}));

let rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected');

  // Crear una sala
  socket.on('createRoom', (roomCode, userName) => {
    rooms[roomCode] = { host: socket.id, guests: [], hostName: userName, videoUrl: '' };
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
  });

  // Unirse a una sala
  socket.on('joinRoom', (roomCode, userName) => {
    if (rooms[roomCode]) {
      rooms[roomCode].guests.push({ id: socket.id, name: userName });
      socket.join(roomCode);
      socket.emit('roomJoined', roomCode);
      io.to(rooms[roomCode].host).emit('guestJoined', userName);
      io.to(socket.id).emit('hostName', rooms[roomCode].hostName); // Enviar nombre del host al invitado
      io.to(socket.id).emit('videoUrl', rooms[roomCode].videoUrl); // Enviar URL del video al invitado
      console.log(`Un invitado se ha unido a tu sala: ${userName}`);
    } else {
      socket.emit('roomNotFound');
    }
  });

  // Reproducir video
  socket.on('play_video', (roomCode) => {
    io.to(roomCode).emit('play_video');
  });

  // Pausar video
  socket.on('pause_video', (roomCode) => {
    io.to(roomCode).emit('pause_video');
  });

  // Buscar video
  socket.on('seekVideo', (roomCode, time) => {
    io.to(roomCode).emit('seekVideo', time);
  });

  // Establecer URL del video
  socket.on('setVideoUrl', (roomCode, url) => {
    rooms[roomCode].videoUrl = url;
    io.to(roomCode).emit('videoUrl', url);
  });

  // Desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Escuchar en el puerto proporcionado por Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
