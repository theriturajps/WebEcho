const Room = require('./models/Room');
const User = require('./models/User');

module.exports = (io) => {
  // Track rooms and connections
  const roomClients = {};

  // Initialize room client counter if not exists
  const initRoomCounter = (roomName) => {
    if (!roomClients[roomName] && roomClients[roomName] !== 0) {
      roomClients[roomName] = 0;
    }
  };

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    let currentRoom = null;

    // Join a room
    socket.on('join-room', async (roomName) => {
      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        roomClients[currentRoom]--;
        io.to(currentRoom).emit('client-count', roomClients[currentRoom]);
      }

      // Sanitize room name
      const sanitizedRoom = roomName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50);
      currentRoom = sanitizedRoom || 'default';

      try {
        const room = await Room.findOne({ name: currentRoom });
        let canAccess = true;

        if (room && room.claimedBy) {
          const isOwner = socket.request.session.userId && room.claimedBy.equals(socket.request.session.userId);
          const hasPasswordAccess = socket.request.session.authorizedRooms?.includes(room._id.toString());

          canAccess = isOwner || hasPasswordAccess;
        }

        if (!canAccess) {
          return socket.emit('room-status', {
            claimed: true,
            canAccess: false,
            requiresPassword: true
          });
        }

        // Join new room
        socket.join(currentRoom);
        initRoomCounter(currentRoom);
        roomClients[currentRoom]++;

        io.to(currentRoom).emit('client-count', roomClients[currentRoom]);

        socket.emit('room-status', {
          claimed: room?.claimedBy ? true : false,
          canAccess: true,
          requiresPassword: false
        });

      } catch (err) {
        console.error('Error joining room:', err);
        socket.emit('room-status', {
          claimed: false,
          canAccess: false,
          requiresPassword: false
        });
      }
    });

    // handle deleting a room
    socket.on('delete-room', (roomName) => {
      socket.to(roomName).emit('room-deleted');
      socket.leave(roomName);
    });

    // Handle text updates
    socket.on('text-update', async (text) => {
      if (!currentRoom) return;
      
      try {
        // Broadcast text to all clients in the room except sender
        socket.to(currentRoom).emit('text-update', text);
      } catch (err) {
        console.error('Error processing text update:', err);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (currentRoom && roomClients[currentRoom] && roomClients[currentRoom] > 0) {
        roomClients[currentRoom]--;
        io.to(currentRoom).emit('client-count', roomClients[currentRoom]);
      }
    });
  });
};