import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    where
} from 'firebase/firestore';

const COLLECTION_NAME = 'service_queue';

// Listen to queue changes in real-time (Kanban needs this)
export const subscribeToQueue = (callback) => {
    // Only fetch today's or active queues to keep it lightweight.
    // For simplicity, we just fetch all that aren't archived, or just all recent ones.
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const queueData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Optional: filter out older "Selesai" items if they exceed 24 hours, handled in UI or here.
        callback(queueData);
    }, (error) => {
        console.error("Error listening to queue:", error);
    });
};

export const addQueueItem = async (queueData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...queueData,
            status: 'Menunggu', // 'Menunggu' | 'Dikerjakan' | 'Selesai'
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding queue item:", error);
        throw error;
    }
};

export const updateQueueStatus = async (id, newStatus) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status: newStatus,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating queue status:", error);
        throw error;
    }
};

export const deleteQueueItem = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting queue item:", error);
        throw error;
    }
};
