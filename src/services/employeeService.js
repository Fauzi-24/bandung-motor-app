import { db, secondaryAuth } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDocs,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const COLLECTION_NAME = 'employees';

export const getEmployees = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching employees:", error);
        throw error;
    }
};

export const addEmployee = async (employeeData, password) => {
    try {
        let authUid = null;

        // 1. If password is provided, try to create an auth user first
        if (password && employeeData.email) {
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                employeeData.email,
                password
            );
            authUid = userCredential.user.uid;
        }

        // 2. Add to Firestore. If we have UID, use setDoc with that UID. Otherwise addDoc.
        if (authUid) {
            const docRef = doc(db, COLLECTION_NAME, authUid);
            await setDoc(docRef, {
                ...employeeData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return authUid;
        } else {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...employeeData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error("Error adding employee:", error);
        throw error;
    }
};

export const updateEmployee = async (id, employeeData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...employeeData,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        throw error;
    }
};

export const deleteEmployee = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting employee:", error);
        throw error;
    }
};
export const resetEmployeePassword = async (email) => {
    try {
        await sendPasswordResetEmail(secondaryAuth, email);
    } catch (error) {
        console.error("Error sending reset email:", error);
        throw error;
    }
};
