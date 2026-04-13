// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase_config";

const AuthContext = createContext(null);

// Handles AuthProvider.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep React state aligned with Firebase auth.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handles register.
  const register = async ({ email, password, displayName }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    await sendEmailVerification(user);

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name: displayName,
        displayName: displayName || user.email?.split("@")[0] || "Developer",
        email: user.email,
        bio: "",
        github: "",
        skills: [],
        avatarUrl: "",
        emailVerified: false,
        isPrivate: false,
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return user;
  };

  // Handles login.
  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      await signOut(auth);
      throw new Error(
        "Please verify your email before logging in. Check your inbox for the verification link."
      );
    }

    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName:
          credential.user.displayName || credential.user.email?.split("@")[0] || "Developer",
        photoURL: credential.user.photoURL || "",
        emailVerified: true,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return credential.user;
  };

  // Central logout helper for the app.
  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Handles useAuth.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

