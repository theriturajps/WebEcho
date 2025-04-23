document.addEventListener('DOMContentLoaded', () => {

	// Password form
	const passwordForm = document.getElementById('password-form');
	if (passwordForm) {
		passwordForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const currentPassword = document.getElementById('current-password').value;
			const newPassword = document.getElementById('new-password').value;
			const confirmPassword = document.getElementById('confirm-password').value;

			if (newPassword !== confirmPassword) {
				showToast('New passwords do not match', 'error');
				return;
			}

			try {
				const response = await fetch('/auth/update-password', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						currentPassword,
						newPassword,
						confirmPassword
					})
				});

				const data = await response.json();

				if (data.success) {
					showToast('Password updated successfully!', 'success');
					passwordForm.reset();
				} else {
					showToast(data.message, 'error');
				}
			} catch (error) {
				console.error('Error updating password:', error);
				showToast('Failed to update password', 'error');
			}
		});
	}

	// Preferences form
	const preferencesForm = document.getElementById('preferences-form');
	if (preferencesForm) {
		preferencesForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const formData = new FormData(preferencesForm);
			const preferences = {
				theme: formData.get('theme'),
				autoSave: formData.get('autoSave') === 'on'
			};

			try {
				const response = await fetch('/auth/update-preferences', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ preferences })
				});

				const data = await response.json();

				if (data.success) {
					showToast('Preferences saved!', 'success');
					// Apply theme immediately
					document.body.classList.remove('dark-mode', 'light-mode');
					document.body.classList.add(`${preferences.theme}-mode`);
					localStorage.setItem('darkMode', preferences.theme === 'dark');
				} else {
					showToast(data.message, 'error');
				}
			} catch (error) {
				console.error('Error saving preferences:', error);
				showToast('Failed to save preferences', 'error');
			}
		});
	}

	// Resend verification button
	const resendVerificationBtn = document.getElementById('resend-verification');
	if (resendVerificationBtn) {
		resendVerificationBtn.addEventListener('click', async () => {
			// Disable button and change text to "Please wait..."
			const originalText = resendVerificationBtn.textContent;
			resendVerificationBtn.disabled = true;
			resendVerificationBtn.textContent = 'Please wait...';

			try {
				const response = await fetch('/auth/email/signup/resend', {
					method: 'POST'
				});

				// Check if the response is valid JSON before trying to parse it
				const contentType = response.headers.get('content-type');
				let data;

				if (contentType && contentType.includes('application/json')) {
					data = await response.json();

					if (data.success) {
						showToast(data.message, 'success');
					} else {
						showToast(data.message || 'Failed to resend verification email', 'error');
					}
				} else {
					// Handle non-JSON responses (like rate limit messages)
					const errorText = await response.text();
					showToast(errorText || 'Failed to resend verification email', 'error');
				}
			} catch (error) {
				console.error('Error resending verification:', error);
				showToast('Failed to resend verification email', 'error');
			} finally {
				// Re-enable button and restore original text
				resendVerificationBtn.disabled = false;
				resendVerificationBtn.textContent = originalText;
			}
		});
	}

	const deleteAccountForm = document.getElementById('delete-account-form');
	if (deleteAccountForm) {
		deleteAccountForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const password = document.getElementById('delete-password').value;

			if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
				return;
			}

			try {
				const response = await fetch('/delete-account', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ password })
				});

				const data = await response.json();

				if (data.success) {
					showToast('Account deleted successfully', 'success');
					setTimeout(() => {
						window.location.href = data.redirect || '/';
					}, 1500);
				} else {
					showToast(data.message, 'error');
				}
			} catch (error) {
				console.error('Error deleting account:', error);
				showToast('Failed to delete account', 'error');
			}
		});
	}

	// Delete room buttons
	document.querySelectorAll('.delete-room').forEach(button => {
		button.addEventListener('click', async () => {
			const roomName = button.dataset.room;

			if (confirm(`Are you sure you want to delete room "${roomName}"? This cannot be undone.`)) {
				try {
					const response = await fetch('/delete', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ roomName })
					});

					const data = await response.json();

					if (data.success) {
						showToast('Room deleted successfully', 'success');
						setTimeout(() => {
							window.location.reload();
						}, 1500);
					} else {
						showToast(data.message, 'error');
					}
				} catch (error) {
					console.error('Error deleting room:', error);
					showToast('Failed to delete room', 'error');
				}
			}
		});
	});

});

function showToast(message, type = 'info') {
	const toast = document.getElementById('toast');
	toast.textContent = message;
	toast.className = 'toast visible ' + type;
	setTimeout(() => toast.classList.remove('visible'), 3000);
}