import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  Auth 
} from "firebase/auth";

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let provider: GoogleAuthProvider | null = null;
let auth: Auth | null = null;

// Helper to fetch config and initialize or get existing app
async function getFirebaseAuthInstance(): Promise<Auth> {
  if (auth) return auth;

  if (getApps().length > 0) {
    const existingApp = getApp();
    auth = getAuth(existingApp);
    return auth;
  }

  // Fetch the config dynamically from the server endpoint
  const res = await fetch("/api/firebase-config");
  if (!res.ok) {
    throw new Error("Failed to load authentication configuration from server");
  }
  const firebaseConfig = await res.json();
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
}

// Google Sign In trigger
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const authInstance = await getFirebaseAuthInstance();
    
    if (!provider) {
      provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/gmail.send");
      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
      provider.addScope("https://www.googleapis.com/auth/gmail.metadata");
      provider.addScope("https://www.googleapis.com/auth/gmail.labels");
    }

    const result = await signInWithPopup(authInstance, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Gmail access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Gmail authorization error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGmail = async () => {
  try {
    const authInstance = await getFirebaseAuthInstance();
    await signOut(authInstance);
  } catch (e) {
    console.warn("Sign out called before auth was initialized", e);
  }
  cachedAccessToken = null;
};
