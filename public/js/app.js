// Connect to Socket.io server
const socket = io();

// DOM Elements
const roomNameElement = document.getElementById('room-name');
const clientCountElement = document.getElementById('client-count');
const sharedTextElement = document.getElementById('shared-text');
const changeRoomBtn = document.getElementById('change-room-btn');
const claimRoomBtn = document.getElementById('claim-room-btn');
const authBtn = document.getElementById('auth-btn');
const clearTextBtn = document.getElementById('clear-text-btn');
const signoutBtn = document.getElementById('signout-btn');
const deleteRoomBtn = document.getElementById('delete-room-btn');

// Dialogs
const roomDialog = document.getElementById('room-dialog');
const authDialog = document.getElementById('auth-dialog');
const newRoomNameInput = document.getElementById('new-room-name');
const cancelRoomChangeBtn = document.getElementById('cancel-room-change');
const confirmRoomChangeBtn = document.getElementById('confirm-room-change');

// Auth dialog elements
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLoginBtn = document.getElementById('back-to-login');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const forgotEmailInput = document.getElementById('forgot-email');
const cancelLoginBtn = document.getElementById('cancel-login');
const confirmLoginBtn = document.getElementById('confirm-login');
const cancelSignupBtn = document.getElementById('cancel-signup');
const confirmSignupBtn = document.getElementById('confirm-signup');
const sendResetBtn = document.getElementById('send-reset');

// Toast notification
const toast = document.getElementById('toast');

// Get current room name from URL
const currentRoom = roomNameElement.textContent.trim();

// Debounce function
function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Connect to the room
socket.emit('join-room', currentRoom);

// Event Listeners
sharedTextElement.addEventListener('input', debounce(() => {
  const text = sharedTextElement.value;
  socket.emit('text-update', text);
  updateTextStats();
}));

// Update text stats
function updateTextStats() {
  const text = sharedTextElement.value;
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  document.getElementById('char-count').textContent = charCount;
  document.getElementById('word-count').textContent = wordCount;
}

// Room change dialog
changeRoomBtn?.addEventListener('click', () => {
  openDialog(roomDialog);
  newRoomNameInput.value = currentRoom;
  newRoomNameInput.focus();
});

cancelRoomChangeBtn?.addEventListener('click', () => {
  closeDialog(roomDialog);
});

confirmRoomChangeBtn?.addEventListener('click', () => {
  const newRoomName = newRoomNameInput.value.trim();
  if (newRoomName) {
    window.location.href = `/${encodeURIComponent(newRoomName)}`;
  }
});

// Room name click event
roomNameElement?.addEventListener('click', () => {
  openDialog(roomDialog);
  newRoomNameInput.value = currentRoom;
  newRoomNameInput.focus();
});

// Submit room dialog on Enter key
newRoomNameInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    confirmRoomChangeBtn.click();
  }
});

// Clear text button
clearTextBtn?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all text?')) {
    sharedTextElement.value = '';
    socket.emit('text-update', '');
    updateTextStats();
  }
});

// Auth button
authBtn?.addEventListener('click', () => {
  openDialog(authDialog);
  loginEmailInput.focus();
});

// Auth dialog tabs
loginTab?.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  forgotPasswordForm.classList.add('hidden');
});

signupTab?.addEventListener('click', () => {
  loginTab.classList.remove('active');
  signupTab.classList.add('active');
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
  forgotPasswordForm.classList.add('hidden');
});

// Forgot password link
forgotPasswordLink?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  forgotPasswordForm.classList.remove('hidden');
  forgotEmailInput.focus();
});

// Back to login button
backToLoginBtn?.addEventListener('click', () => {
  forgotPasswordForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  loginEmailInput.focus();
});

// Cancel auth buttons
cancelLoginBtn?.addEventListener('click', () => {
  closeDialog(authDialog);
});

cancelSignupBtn?.addEventListener('click', () => {
  closeDialog(authDialog);
});

// Login form submission
confirmLoginBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'warning');
    return;
  }

  // Disable the button and show waiting text
  confirmLoginBtn.disabled = true;
  const originalText = confirmLoginBtn.textContent;
  confirmLoginBtn.textContent = 'Please wait...';

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        roomName: currentRoom
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeDialog(authDialog);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again.', 'error');
  } finally {
    // Re-enable button and reset text if needed
    confirmLoginBtn.disabled = false;
    confirmLoginBtn.textContent = originalText;
  }
});


// Signup form submission
confirmSignupBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'warning');
    return;
  }

  // Disable the button and change its text
  confirmSignupBtn.disabled = true;
  const originalText = confirmSignupBtn.textContent;
  confirmSignupBtn.textContent = 'Please wait...';

  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        roomName: currentRoom
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeDialog(authDialog);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showToast('Signup failed. Please try again.', 'error');
  } finally {
    signupEmailInput.value = '';
    signupPasswordInput.value = '';
    confirmSignupBtn.disabled = false;
    confirmSignupBtn.textContent = originalText;
  }
});

// Reset password request
sendResetBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = forgotEmailInput.value.trim();

  if (!email) {
    showToast('Please enter your email', 'warning');
    return;
  }

  // Disable the button and show waiting text
  sendResetBtn.disabled = true;
  const originalText = sendResetBtn.textContent;
  sendResetBtn.textContent = 'Please wait...';

  try {
    const response = await fetch('/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      showToast('OTP sent to your email', 'success');
      setTimeout(() => {
        closeDialog(authDialog);
        window.location.href = `/auth/reset-password?email=${encodeURIComponent(email)}`;
      }, 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    showToast('Failed to send OTP', 'error');
  } finally {
    // Re-enable the button and reset the text
    sendResetBtn.disabled = false;
    sendResetBtn.textContent = originalText;
  }
});

// Sign out button
signoutBtn?.addEventListener('click', async () => {
  try {
    const response = await fetch('/auth/logout', {
      method: 'GET'
    });

    if (response.ok) {
      showToast('Signed out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      showToast('Sign out failed', 'error');
    }
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Sign out failed', 'error');
  }
});

// Claim room button
claimRoomBtn?.addEventListener('click', async () => {
  try {
    const response = await fetch('/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomName: currentRoom })
    });

    const data = await response.json();

    if (data.success) {
      // Show password to the owner in an alert
      alert(`Room claimed successfully!\n\nRoom Password: ${data.password}\n\nShare this password with others to grant them access.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Error claiming room:', error);
    showToast('Failed to claim room. Please try again.', 'error');
  }
});

// Delete room button
deleteRoomBtn?.addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete this room? All data will be permanently lost!')) {
    try {
      const response = await fetch('/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomName: currentRoom })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Room deleted successfully', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      showToast('Failed to delete room', 'error');
    }
  }
});

// Socket.io event handlers
socket.on('client-count', (count) => {
  if (clientCountElement) {
    clientCountElement.textContent = `${count} online`;
  }
});

socket.on('text-update', (text) => {
  if (sharedTextElement.value !== text) {
    sharedTextElement.value = text;
    updateTextStats();
  }
});

socket.on('room-status', (data) => {
  if (!data.canAccess) {
    window.location.href = '/';
  }
});

socket.on('room-deleted', () => {
  showToast('This room has been deleted by the owner', 'warning');
  setTimeout(() => {
    window.location.href = '/';
  }, 2000);
});

// Helper functions
function openDialog(dialog) {
  dialog.classList.add('visible');
}

function closeDialog(dialog) {
  dialog.classList.remove('visible');
}

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = 'toast visible';
  toast.classList.add(type);

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateTextStats();

  // Check URL for claim parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('claim') === 'true' && claimRoomBtn) {
    claimRoomBtn.click();
  }
});