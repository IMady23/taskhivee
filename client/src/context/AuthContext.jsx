import React, { createContext, useReducer, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { syncUserProfile } from '../utils/syncUserProfile';
import { initializePresence, setUserOffline } from '../services/presenceService';

/**
 * AuthContext & AuthProvider (Firebase Version)
 * Manages global authentication state using Firebase Auth and Firestore
 * Provides: user, token, login, logout, register, verifyOTP, resendOTP
 * Enhanced with better session persistence and loading states
 */
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('authToken') || null,
  isLoading: true,
  isInitializing: true, // Separate flag for initial auth check
  error: null,
  isAuthenticated: false, // Will be set properly after auth check
  sessionRestored: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_INITIALIZING':
      return { ...state, isInitializing: true, isLoading: true };
    case 'AUTH_INITIALIZED':
      return { ...state, isInitializing: false, isLoading: false, sessionRestored: true };
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isInitializing: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        sessionRestored: true,
        error: null,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        isLoading: false,
        isInitializing: false,
        error: action.payload,
        sessionRestored: true,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        isInitializing: false,
        isAuthenticated: false,
        token: null,
        sessionRestored: true,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SESSION_RESTORED':
      return { ...state, sessionRestored: true, isInitializing: false };
    default:
      return state;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize presence tracking when user logs in
  useEffect(() => {
    let cleanupPresence = null;

    if (state.user?.uid) {
      // Initialize presence tracking
      cleanupPresence = initializePresence(state.user.uid, {
        name: state.user.name,
        email: state.user.email,
        role: state.user.role,
        photoURL: state.user.photoURL
      });
    }

    return () => {
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, [state.user?.uid]);

  // Enhanced Firebase auth state listener with better session handling
  useEffect(() => {
    dispatch({ type: 'AUTH_INITIALIZING' });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          // Initial fetch to set state quickly (optional, but good for immediate responsiveness)
          // But we will rely on onSnapshot for the source of truth.

          // Setup real-time listener for user profile
          // Note: We need to manage this subscription. 
          // Since onAuthStateChanged can fire multiple times, we should probably handle the listener in a separate useEffect
          // dependent on the auth user, OR assign it to a ref. 
          // However, for simplicity in this Context structure, a separate useEffect for the DB listener is cleaner.

          // Here we just set the basic auth user, and let the separate effect handle the DB sync.
          const token = await firebaseUser.getIdToken();
          // We'll set a temporary user state so the app knows we have a User UID
          // The full profile will come from the snapshot listener.
          // But to avoid "Flicker", we might want to wait for the first snapshot?
          // The current implementation waits for getDoc.

          // A better approach without refactoring everything:
          // Keep the getDoc for initial load to ensure 'isAuthenticated' becomes true with data.
          const userDocSnap = await getDoc(userDocRef);
          let userData = null;

          if (userDocSnap.exists()) {
            const userProfile = userDocSnap.data();
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userProfile,
            };
          } else {
            // Create profile if missing
            await createProfile(firebaseUser.uid, {
              name: firebaseUser.displayName || firebaseUser.email,
              email: firebaseUser.email,
              role: 'member'
            });
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              role: 'member',
              isEmailVerified: true
            };
          }

          // Sync Local Profile (Base64 from localStorage)
          const localProfileKey = `taskhive_profile_${firebaseUser.email}`;
          const localProfileData = localStorage.getItem(localProfileKey);
          if (localProfileData) {
            try {
              const parsed = JSON.parse(localProfileData);
              if (parsed.image) {
                userData.photoURL = parsed.image;
              }
            } catch (e) {
              console.warn("Failed to parse local profile data", e);
            }
          }

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: userData,
              token,
            },
          });

        } else {
          dispatch({ type: 'AUTH_INITIALIZED' }); // Or LOGOUT
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: 'AUTH_FAIL', payload: error.message });
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Profile Sync
  useEffect(() => {
    let unsubscribeSnapshot;
    if (state.user?.uid) {
      const userDocRef = doc(db, 'users', state.user.uid);
      unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const updatedProfile = docSnap.data();
          // Diff check to avoid loops if needed, but dispatching same object is usually fine or handled by reducer
          // We merge with existing user object to keep local props if any (like token)
          // BUT we must ensure we don't overwrite token if it's not in Firestore.
          // Firestore has: name, email, role, teamId, etc.
          // State user has: uid, token, ...

          // Sync Local Profile (Base64)
          const localProfileKey = `taskhive_profile_${state.user.email}`;
          const localProfileData = localStorage.getItem(localProfileKey);
          let photoURL = updatedProfile.photoURL;

          if (localProfileData) {
            try {
              const parsed = JSON.parse(localProfileData);
              if (parsed.image) {
                photoURL = parsed.image;
              }
            } catch (e) {
              console.warn("Failed to parse local profile data", e);
            }
          }

          dispatch({
            type: 'SET_USER',
            payload: {
              ...state.user,
              ...updatedProfile,
              photoURL, // Priority to local Base64
              updatedAt: updatedProfile.updatedAt // Ensure timestamps pass through
            }
          });
        } else {
          // Doc deleted? Logout?
          // dispatch({ type: 'LOGOUT' }); 
        }
      }, (err) => {
        console.warn("Profile sync error:", err);
      });
    }
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.uid]); // Removed state.user to break infinite loop

  // Enhanced token management with automatic refresh
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('authToken', state.token);

      // Set up token refresh interval (refresh every 50 minutes, tokens expire in 1 hour)
      const refreshInterval = setInterval(async () => {
        try {
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            localStorage.setItem('authToken', newToken);
            dispatch({
              type: 'SET_USER',
              payload: { ...state.user, token: newToken }
            });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If token refresh fails, user might need to re-authenticate
          if (error.code === 'auth/user-token-expired') {
            dispatch({ type: 'LOGOUT' });
          }
        }
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(refreshInterval);
    } else {
      localStorage.removeItem('authToken');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]); // Removed state.user to break infinite loop

  // Session restoration check on app load
  useEffect(() => {
    const checkStoredSession = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken && !state.sessionRestored) {
        try {
          // Verify the stored token is still valid
          if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
          }
        } catch (error) {
          console.warn('Stored token is invalid, clearing session:', error);
          localStorage.removeItem('authToken');
          dispatch({ type: 'SESSION_RESTORED' });
        }
      }
    };

    if (!state.sessionRestored && !state.isInitializing) {
      checkStoredSession();
    }
  }, [state.sessionRestored, state.isInitializing]);



  /**
   * Create user profile in Firestore (client-side)
   */
  const createProfile = async (uid, { name, email, role, teamId, organization }) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      name: name || email,
      email,
      role: role || 'member',
      isEmailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      ...(teamId && { teamId }),
      ...(organization && { organization })
    });
  };

  /**
   * Register new leader (client-only: Firebase Auth + Firestore profile, no OTP)
   * Creates a team if organizationName is provided, or joins one if teamCode is provided.
   */
  const registerLeader = async (name, email, password, confirmPassword, organizationName, teamCode) => {
    dispatch({ type: 'AUTH_START' });
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create Team Document first if organization name is provided
      let teamId = null;
      let generatedTeamCode = null;

      if (organizationName && !teamCode) {
        // Generate a simple unique 6-character team code
        // In a real app we might want to ensure uniqueness via cloud function or transaction
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
        generatedTeamCode = '';
        for (let i = 0; i < 6; i++) {
          generatedTeamCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const teamDocRef = await addDoc(collection(db, 'teams'), {
          name: organizationName,
          teamId: generatedTeamCode, // Searchable team code
          leaderId: firebaseUser.uid,
          members: [firebaseUser.uid], // Leader is first member
          invitedMembers: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        teamId = teamDocRef.id;
      } else if (teamCode) {
        // JOIN existing team as co-leader
        const { joinTeamAsLeader } = await import('../services/teamService');
        const { getPendingRequestByEmail, updateLeadershipRequest } = await import('../services/leadershipService');

        const joinedTeam = await joinTeamAsLeader(firebaseUser.uid, teamCode);
        teamId = joinedTeam.id;
        organizationName = joinedTeam.name || organizationName;

        // Auto-accept request if exists
        try {
          const pendingRequest = await getPendingRequestByEmail(email);
          if (pendingRequest && pendingRequest.id) {
            await updateLeadershipRequest(pendingRequest.id, { status: 'accepted' });
          }
        } catch (e) {
          console.warn('Could not auto-accept leadership request:', e);
        }
      }

      await createProfile(firebaseUser.uid, {
        name: name || email,
        email,
        role: 'leader',
        teamId: teamId, // Link team to leader
        organization: organizationName
      });

      const token = await firebaseUser.getIdToken();
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name || email,
        role: 'leader',
        teamId: teamId,
        organization: organizationName,
        isEmailVerified: true,
      };

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: userData,
          token,
        },
      });
      return { success: true, user: userData };
    } catch (error) {
      const code = error?.code || '';
      let msg = error?.message || 'Registration failed';
      if (code === 'auth/email-already-in-use') msg = 'This email is already registered. Try logging in.';
      if (code === 'auth/invalid-email') msg = 'Invalid email address.';
      if (code === 'auth/weak-password') msg = 'Password is too weak. Please choose a stronger password.';
      dispatch({ type: 'AUTH_FAIL', payload: msg });
      throw new Error(msg);
    }
  };

  /**
   * Register new member via Backend (Strict Validation)
   */
  const registerMember = async (name, email, password, confirmPassword, teamCode) => {
    dispatch({ type: 'AUTH_START' });
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { API_BASE_URL } = await import('../config');

      console.log('Sending registration request:', { name, email, teamCode }); // DEBUG

      const response = await fetch(`${API_BASE_URL}/auth/register-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
          teamCode: teamCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Backend returns userId and requiresOTP: true. 
      // User is NOT logged in yet.

      dispatch({
        type: 'AUTH_FAIL', // Technically not a fail, but we aren't "logged in" yet. 
        // Or we can leave state alone. 
        // Using AUTH_FAIL stops the loading spinner.
        payload: null
      });

      return { success: true, message: data.message };

    } catch (error) {
      console.error('Registration error:', error);
      dispatch({ type: 'AUTH_FAIL', payload: error.message });
      throw error;
    }
  };

  /**
   * Verify OTP and complete email verification (DISABLED - using Firebase only)
   */
  const verifyOTP = async (_userId, _otp) => {
    throw new Error('OTP verification is disabled. Using Firebase authentication only.');
  };

  /**
   * Resend OTP to user email (DISABLED - using Firebase only)
   */
  const resendOTP = async (_userId) => {
    throw new Error('OTP resend is disabled. Using Firebase authentication only.');
  };

  /**
   * Login user with email and password
   * Enhanced with team code validation for members
   */
  const login = async (email, password, teamCode = null, userRole = null) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user profile from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile = userDocSnap.exists() ? userDocSnap.data() : null;

      // If no profile (e.g. old user), create one so they can get in
      if (!userProfile) {
        await createProfile(firebaseUser.uid, {
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          role: 'member',
        });
        userProfile = {
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          role: 'member',
          isEmailVerified: true,
        };
      }

      // Team code validation for members
      if (userProfile.role === 'member' || userRole === 'member') {
        if (!teamCode) {
          throw new Error('Team code is required for member login');
        }

        // Validate team code
        const { getTeamById } = await import('../services/teamService');
        const team = await getTeamById(teamCode);

        if (!team) {
          throw new Error('Invalid or missing team code. Please enter the correct code provided by your team leader.');
        }

        // Check if user is part of this team
        if (userProfile.teamId && userProfile.teamId !== team.id) {
          // Check if the old team is active
          const { getTeamByDocId } = await import('../services/teamService');
          try {
            const oldTeam = await getTeamByDocId(userProfile.teamId);
            // If old team exists and is active, block them
            if (oldTeam && oldTeam.isActive) {
              throw new Error('You are already in another team. Please ask your leader to remove you first.');
            }
            // If we get here, old team is either null (not found) or inactive.
            // We allow them to proceed, effectively "leaving" the dead team.
            // We should probably set userProfile.teamId to null locally so the next block runs
            userProfile.teamId = null;
          } catch (err) {
            // If error is strictly about "team not found", we can proceed.
            // But getTeamByDocId might return null or throw.
            // If it throws "You are already...", rethrow.
            if (err.message.includes('already in another team')) throw err;
            console.warn("Could not check old team status, assuming inactive/gone.", err);
            userProfile.teamId = null;
          }
        }

        // If user doesn't have a teamId yet, assign them to this team
        if (!userProfile.teamId) {
          // Add user to team members if not already there
          if (!team.members.includes(firebaseUser.uid)) {
            const { addMemberToTeam } = await import('../services/teamService');
            await addMemberToTeam(teamCode, firebaseUser.uid);
          }

          // Update user profile with team ID
          await updateDoc(userDocRef, {
            teamId: team.id,
            updatedAt: serverTimestamp()
          });

          // CRITICAL FIX: Re-fetch user profile to get updated Name and TeamId
          // because addMemberToTeam updates the name from the invitation.
          const updatedUserDoc = await getDoc(userDocRef);
          if (updatedUserDoc.exists()) {
            userProfile = updatedUserDoc.data();
          } else {
            userProfile.teamId = team.id; // Fallback
          }
        }
      }

      // HANDOVER SUPPORT: If role is leader and teamCode is provided, join team
      if (userProfile.role === 'leader' || userRole === 'leader') {
        if (teamCode && !userProfile.teamId) {
          const { joinTeamAsLeader } = await import('../services/teamService');
          const joinedTeam = await joinTeamAsLeader(firebaseUser.uid, teamCode);
          userProfile.teamId = joinedTeam.id;

          // Auto-accept request if exists
          try {
            const { getPendingRequestByEmail, updateLeadershipRequest } = await import('../services/leadershipService');
            const pendingRequest = await getPendingRequestByEmail(firebaseUser.email);
            if (pendingRequest && pendingRequest.id) {
              await updateLeadershipRequest(pendingRequest.id, { status: 'accepted' });
            }
          } catch (e) {
            console.warn('Could not auto-accept leadership request:', e);
          }

          // Refresh profile data
          const updatedUserDoc = await getDoc(userDocRef);
          if (updatedUserDoc.exists()) {
            userProfile = updatedUserDoc.data();
          }
        }
      }

      const token = await firebaseUser.getIdToken();

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userProfile,
      };

      // 🚀 NEW: Sync Firebase Auth displayName with Firestore
      await syncUserProfile(firebaseUser.uid);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: userData,
          token,
        },
      });

      return { user: userData, token };
    } catch (error) {
      // Map common Firebase auth error codes to friendly messages
      const code = error?.code || '';
      let friendly = error?.message || 'Login failed';

      // Only map Firebase-specific errors, preserve custom error messages
      if (code) {
        switch (code) {
          case 'auth/invalid-api-key':
            friendly = 'Invalid Firebase API key — check your client config.';
            break;
          case 'auth/invalid-email':
            friendly = 'The provided email is invalid.';
            break;
          case 'auth/user-disabled':
            friendly = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            friendly = 'No user found with that email.';
            break;
          case 'auth/wrong-password':
            friendly = 'Incorrect password.';
            break;
          case 'auth/invalid-credential':
            friendly = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            friendly = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            friendly = 'Network error. Please check your connection and try again.';
            break;
          default:
            // Keep the original error message for custom errors (like team code validation)
            break;
        }
      }

      // Enhanced error logging with full details
      console.error('Firebase login error:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
        customData: error?.customData,
        fullError: error
      });
      
      dispatch({ type: 'AUTH_FAIL', payload: friendly });
      throw new Error(friendly);
    }
  };

  /**
   * Logout user with enhanced cleanup
   */
  const logout = async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Set user offline before logging out
      if (state.user?.uid) {
        setUserOffline(state.user.uid);
      }

      await signOut(auth);

      // Clear all stored data
      localStorage.removeItem('authToken');
      sessionStorage.clear();

      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      dispatch({ type: 'LOGOUT' });
      throw new Error(error.message);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * Refresh user token manually
   */
  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const newToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem('authToken', newToken);
        return newToken;
      } catch (error) {
        console.error('Manual token refresh failed:', error);
        throw error;
      }
    }
    throw new Error('No authenticated user');
  };

  const value = {
    user: state.user,
    currentUser: state.user, // Add currentUser alias for Firebase Auth compatibility
    token: state.token,
    isLoading: state.isLoading,
    isInitializing: state.isInitializing,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    sessionRestored: state.sessionRestored,
    login,
    registerLeader,
    registerMember,
    verifyOTP,
    resendOTP,
    logout,
    clearError,
    refreshToken,
    dispatch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
