const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Room routes
router.get('/', (req, res) => res.redirect('/default'));
router.get('/:roomName', roomController.getRoom);
router.post('/claim', roomController.claimRoom);
router.post('/verify-password', roomController.verifyRoomPassword);
router.post('/delete', roomController.deleteRoom);
router.get('/user/rooms', roomController.getUserRooms);

module.exports = router;