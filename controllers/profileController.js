const User = require('../models/User');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

exports.updatePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword, confirmPassword } = req.body;
		const userId = req.session.userId;

		if (!userId) {
			return res.status(401).json({ success: false, message: 'Authentication required' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			return res.status(400).json({ success: false, message: 'Current password is incorrect' });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ success: false, message: 'New passwords do not match' });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		user.password = hashedPassword;
		await user.save();

		return res.status(200).json({ success: true, message: 'Password updated successfully' });

	} catch (error) {
		console.error('Password update error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.updatePreferences = async (req, res) => {
	try {
		const { preferences } = req.body;
		const userId = req.session.userId;

		if (!userId) {
			return res.status(401).json({ success: false, message: 'Authentication required' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		user.preferences = {
			...user.preferences,
			...preferences
		};

		await user.save();

		return res.status(200).json({
			success: true,
			message: 'Preferences updated successfully',
			preferences: user.preferences
		});

	} catch (error) {
		console.error('Preferences update error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

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

exports.deleteAccount = async (req, res) => {
	try {
		const { password } = req.body;
		const userId = req.session.userId;

		if (!userId) {
			return res.status(401).json({ success: false, message: 'Authentication required' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		// Verify password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ success: false, message: 'Incorrect password' });
		}

		// Delete all rooms owned by this user
		await Room.deleteMany({ claimedBy: userId });

		// Delete the user
		await User.deleteOne({ _id: userId });

		// Destroy session
		req.session.destroy();

		return res.status(200).json({
			success: true,
			message: 'Account deleted successfully',
			redirect: '/'
		});

	} catch (error) {
		console.error('Delete account error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};