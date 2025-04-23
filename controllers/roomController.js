const Room = require('../models/Room');
const User = require('../models/User');

// Get room
exports.getRoom = async (req, res) => {
  try {
    const roomName = req.params.roomName || 'default';
    const userId = req.session.userId;
    const isAuthenticated = !!userId;
    let user = null;

    if (isAuthenticated) {
      user = await User.findById(userId);
    }

    // Special handling for default room
    if (roomName === 'default') {
      return res.render('room', {
        roomName,
        isClaimed: false,
        isAuthenticated,
        isVerified: user?.isVerified || false,
        isOwner: false,
        showClaimOption: false,
        email: user?.email || null,
        preferences: user?.preferences || null
      });
    }

    // Check if room exists
    let room = await Room.findOne({ name: roomName });
    let isClaimed = false;
    let canAccess = true;
    let isOwner = false;

    if (room) {
      isClaimed = !!room.claimedBy;

      // If room is claimed, check if user is authorized
      if (isClaimed) {
        isOwner = isAuthenticated && room.claimedBy.equals(userId);

        // Check if user has access via password
        const hasPasswordAccess = req.session.authorizedRooms?.includes(room._id.toString());

        if (!isOwner && !hasPasswordAccess) {
          // Render password prompt
          return res.render('protectedRoomPassword', {
            roomName,
            isAuthenticated,
            email: user?.email || null
          });
        }
      }
    }

    // Render room page
    return res.render('room', {
      roomName,
      isClaimed,
      isAuthenticated,
      isVerified: user?.isVerified || false,
      isOwner,
      showClaimOption: !isClaimed && isAuthenticated && user?.isVerified,
      email: user?.email || null,
      preferences: user?.preferences || null
    });
  } catch (error) {
    console.error('Room access error:', error);
    return res.redirect('/');
  }
};

// Claim room
exports.claimRoom = async (req, res) => {
  try {
    const { roomName } = req.body;
    const userId = req.session.userId;

    // Prevent claiming the default room
    if (roomName === 'default') {
      return res.status(400).json({
        success: false,
        message: 'The default room cannot be claimed'
      });
    }

    // Check if user is authenticated and verified
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.isVerified) {
      return res.status(403).json({ success: false, message: 'Email verification required' });
    }

    // Check if room exists and is not claimed
    let room = await Room.findOne({ name: roomName });

    if (room && room.claimedBy) {
      return res.status(400).json({ success: false, message: 'Room already claimed' });
    }

    // Create or update room
    if (room) {
      room.claimedBy = userId;
      room.generatePassword();
    } else {
      room = new Room({
        name: roomName,
        claimedBy: userId
      });
      room.generatePassword();
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room claimed successfully',
      password: room.password // Send password back to the owner
    });
  } catch (error) {
    console.error('Room claim error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify room password
exports.verifyRoomPassword = async (req, res) => {
  try {
    const { roomName, password } = req.body;
    const room = await Room.findOne({ name: roomName });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.password !== password) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Store authorized room in session
    if (!req.session.authorizedRooms) {
      req.session.authorizedRooms = [];
    }

    // Add room ID to authorized rooms if not already there
    if (!req.session.authorizedRooms.includes(room._id.toString())) {
      req.session.authorizedRooms.push(room._id.toString());
    }

    return res.status(200).json({
      success: true,
      message: 'Password verified',
      roomName: room.name
    });
  } catch (error) {
    console.error('Room password verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const { roomName } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const room = await Room.findOne({ name: roomName });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Verify user owns the room
    if (!room.claimedBy || !room.claimedBy.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Can't delete default room
    if (roomName === 'default') {
      return res.status(400).json({ success: false, message: 'Cannot delete default room' });
    }

    await Room.deleteOne({ name: roomName });
    return res.status(200).json({ success: true, message: 'Room deleted successfully' });

  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's rooms
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const rooms = await Room.find({ claimedBy: userId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};