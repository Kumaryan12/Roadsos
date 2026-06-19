import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import { AuthContext } from "./authContext";
import { auth, googleProvider } from "../firebase";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const allowedAdminEmails = useMemo(() => {
    return (import.meta.env.VITE_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAdmin =
    Boolean(user) &&
    (allowedAdminEmails.length === 0 ||
      allowedAdminEmails.includes(user.email?.toLowerCase()));

  const value = {
    user,
    loading,
    isAdmin,
    adminRestricted: allowedAdminEmails.length > 0,
    signInWithGoogle,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
