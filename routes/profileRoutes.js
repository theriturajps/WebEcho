const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const profileController = require('../controllers/profileController');

// Profile routes
router.get('/profile', async (req, res) => {
	if (!req.session.userId) {
		return res.redirect('/auth/login');
	}

	try {
		const user = await User.findById(req.session.userId);
		if (!user) {
			return res.redirect('/auth/login');
		}

		const rooms = await Room.find({ claimedBy: req.session.userId }).sort({ createdAt: -1 });

		res.render('profile', {
			user,
			rooms,
			isAuthenticated: true,
			isVerified: user.isVerified
		});
	} catch (error) {
		console.error('Profile error:', error);
		res.redirect('/auth/login');
	}
});

router.post('/update-password', profileController.updatePassword);
router.post('/update-preferences', profileController.updatePreferences);
router.get('/user/rooms', profileController.getUserRooms);
router.post('/delete-account', profileController.deleteAccount);

module.exports = router;