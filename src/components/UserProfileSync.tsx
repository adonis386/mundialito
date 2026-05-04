"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/client";

/**
 * Sincroniza `displayName` (y metadatos básicos) a `users/{uid}` para enriquecer leaderboards en Cloud Functions.
 */
export function UserProfileSync() {
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) return;
      const displayName = user.displayName?.trim() || null;
      const email = user.email?.trim() || null;
      const photoURL = user.photoURL?.trim() || null;
      void setDoc(
        doc(firestore, "users", user.uid),
        {
          displayName,
          email,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
    return () => unsub();
  }, []);

  return null;
}
