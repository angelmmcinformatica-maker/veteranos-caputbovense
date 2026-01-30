import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types/league';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isReferee: boolean;
  isDelegate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();

  // Fetch user data from Firestore based on email/username
  const fetchUserData = async (email: string): Promise<User | null> => {
    try {
      const usersRef = collection(db, 'users');
      
      // Try to find by email first (username field might contain email)
      const q = query(usersRef, where('username', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      
      // Also try matching by extracting username from email
      const usernameFromEmail = email.split('@')[0];
      const q2 = query(usersRef, where('username', '==', usernameFromEmail));
      const querySnapshot2 = await getDocs(q2);
      
      if (!querySnapshot2.empty) {
        const doc = querySnapshot2.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && user.email) {
        const data = await fetchUserData(user.email);
        setUserData(data);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const signIn = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    
    console.log('Attempting login with username:', username);
    
    try {
      // FIRST: Try to authenticate with Firestore (for delegates/referees)
      console.log('Trying Firestore authentication...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        
        // Check password
        if (userData.password === password) {
          console.log('Firestore auth success:', userData.fullName);
          setCurrentUser({ uid: userData.id, email: username } as any);
          setUserData(userData);
          setLoading(false);
          return true;
        } else {
          setError('Contraseña incorrecta');
          setLoading(false);
          return false;
        }
      }
      
      // SECOND: Try Firebase Auth (for admins with email)
      console.log('User not found in Firestore, trying Firebase Auth...');
      
      // Check if input looks like an email
      const isEmail = username.includes('@');
      if (!isEmail) {
        setError('Usuario no encontrado');
        setLoading(false);
        return false;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      console.log('Firebase Auth success:', userCredential.user.email);
      
      // Fetch user data from Firestore to get role
      if (userCredential.user.email) {
        const data = await fetchUserData(userCredential.user.email);
        
        if (!data) {
          await firebaseSignOut(auth);
          setError('Usuario autenticado pero no encontrado en la base de datos');
          setLoading(false);
          return false;
        }
        
        setUserData(data);
      }
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Handle specific Firebase Auth errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Usuario no encontrado');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        case 'auth/invalid-email':
          setError('Usuario no encontrado');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Espera unos minutos');
          break;
        case 'auth/invalid-credential':
          setError('Usuario o contraseña incorrectos');
          break;
        case 'auth/network-request-failed':
          setError('Error de red. Verifica tu conexión');
          break;
        default:
          setError('Usuario o contraseña incorrectos');
      }
      
      setLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    error,
    signIn,
    signOut,
    isAdmin: userData?.role === 'admin',
    isReferee: userData?.role === 'referee',
    isDelegate: userData?.role === 'delegate',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
