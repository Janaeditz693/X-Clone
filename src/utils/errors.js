/**
 * Translates Firebase Authentication and Firestore error codes into human-readable messages.
 */
export const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account matches this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'The password is too weak. It must be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'The Google login popup was closed. Please try again.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Reset your password or try again later.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
};
