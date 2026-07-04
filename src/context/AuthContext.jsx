import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebaseConfig';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to generate a unique-looking username
  const generateUniqueUsername = async (displayName, email) => {
    let base = 'user';
    if (displayName) {
      base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (email) {
      base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    if (!base) base = 'user';
    
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${base}${randomDigits}`;
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName });
      const generatedUsername = await generateUniqueUsername(displayName, email);
      
      const newUserDoc = {
        uid: user.uid,
        displayName: displayName || user.email.split('@')[0],
        username: generatedUsername,
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
        coverURL: '',
        bio: '',
        website: '',
        location: '',
        joinedAt: serverTimestamp(),
        followersCount: 0,
        followingCount: 0,
        role: 'user',
        status: 'active'
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserDoc);
      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        const generatedUsername = await generateUniqueUsername(user.displayName, user.email);
        const newUserDoc = {
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          username: generatedUsername,
          email: user.email,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
          coverURL: '',
          bio: '',
          website: '',
          location: '',
          joinedAt: serverTimestamp(),
          followersCount: 0,
          followingCount: 0,
          role: 'user',
          status: 'active'
        };
        await setDoc(userDocRef, newUserDoc);
      }
      return user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(false); // Render UI immediately, do not block page transition on DB timeout
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            
            // Ban check implementation
            if (data.status === 'banned') {
              toast.error("Your account has been banned by the administrator.", { duration: 5000 });
              await signOut(auth);
              setCurrentUser(null);
              setUserData(null);
            } else {
              setUserData(data);
            }
          } else {
            setUserData({
              uid: user.uid,
              displayName: user.displayName || user.email.split('@')[0],
              username: user.email.split('@')[0],
              photoURL: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
              role: 'user',
              status: 'active'
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserData({
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            username: user.email.split('@')[0],
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
            role: 'user',
            status: 'active'
          });
          toast.error("Database connection failed. Please check your Firestore security rules.", { id: 'rules-warning' });
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signUpWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
