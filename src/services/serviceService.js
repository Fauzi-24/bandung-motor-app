import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'services';

export const getServices = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};

export const addService = async (serviceData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...serviceData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding service:", error);
        throw error;
    }
};

export const updateService = async (id, serviceData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...serviceData,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating service:", error);
        throw error;
    }
};

export const deleteService = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting service:", error);
        throw error;
    }
};
