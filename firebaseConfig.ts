import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile,
} from "firebase/auth";
import {
    getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
    getDocs, query, orderBy, serverTimestamp, onSnapshot, where
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyACxQcOLDQZ4me2pQ4WszW_lnIA__PIou8",
    authDomain: "irigo-d65a4.firebaseapp.com",
    projectId: "irigo-d65a4",
    storageBucket: "irigo-d65a4.firebasestorage.app",
    messagingSenderId: "563745426802",
    appId: "1:563745426802:web:62280e13ac97fb7137a1eb"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        return {
            success: true,
            user: userCredential.user,
            token,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
};

export const registerWithEmail = async (email, password, displayName = "") => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName) {
            await updateProfile(userCredential.user, { displayName });
        }

        return { success: true, user: userCredential.user, error: null };
    } catch (error) {
        return { success: false, error: getErrorMessage(error.code) };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = () => auth.currentUser;

export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export const getIdToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    try {
        return await auth.currentUser.getIdToken(forceRefresh);
    } catch (error) {
        console.error("Error getting token:", error);
        return null;
    }
};

const todosCollection = collection(db, "todos");

export const createTodo = async (todoData, userId = null) => {
    try {
        const user = auth.currentUser;
        const effectiveUserId = userId || user?.uid;
        const effectiveUserEmail = user?.email || null;

        if (!effectiveUserId) {
            return { success: false, error: "User ID tidak ditemukan" };
        }

        const todoWithMeta = {
            ...todoData,
            userId: effectiveUserId,
            userEmail: effectiveUserEmail,
            completed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(todosCollection, todoWithMeta);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Create todo error:", error);
        return { success: false, error: error.message };
    }
};

export const updateTodo = async (id, updatedData) => {
    try {
        const todoRef = doc(db, "todos", id);
        await updateDoc(todoRef, {
            ...updatedData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Update todo error:", error);
        return { success: false, error: error.message };
    }
};

export const deleteTodo = async (id) => {
    try {
        await deleteDoc(doc(db, "todos", id));
        return { success: true };
    } catch (error) {
        console.error("Delete todo error:", error);
        return { success: false, error: error.message };
    }
};

export const subscribeToTodos = (callback, userId = null) => {
    try {
        let q;

        if (userId) {
            q = query(
                todosCollection,
                where("userId", "==", userId),
                orderBy("createdAt", "desc")
            );
        } else {
            q = query(todosCollection, orderBy("createdAt", "desc"));
        }

        return onSnapshot(
            q,
            (snapshot) => {
                const todos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(todos, null);
            },
            (error) => {
                console.error("Subscription error:", error);
                callback([], error);
            }
        );
    } catch (error) {
        console.error("Subscribe setup error:", error);
        return () => { };
    }
};

export const getErrorMessage = (errorCode) => {
    const messages = {
        "auth/user-not-found": "Akun tidak ditemukan",
        "auth/wrong-password": "Password salah",
        "auth/invalid-email": "Email tidak valid",
        "auth/email-already-in-use": "Email sudah terdaftar",
        "auth/weak-password": "Password minimal 6 karakter",
        "auth/network-request-failed": "Koneksi internet bermasalah",
        "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti",
        "auth/invalid-credential": "Email atau password salah",
    };
    return messages[errorCode] || "Terjadi kesalahan";
};

export { app, auth, db };

export default {
    app, auth, db,
    loginWithEmail, registerWithEmail, logout, resetPassword,
    getCurrentUser, onAuthStateChange, getIdToken,
    createTodo, updateTodo, deleteTodo, subscribeToTodos,
    getErrorMessage
};