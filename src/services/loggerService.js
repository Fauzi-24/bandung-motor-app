import { db, auth } from '../lib/firebase';
import {
    collection,
    addDoc,
    Timestamp,
    query,
    orderBy,
    getDocs,
    limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'audit_logs';

export const logAction = async (actionType, moduleName, documentId, details) => {
    try {
        const user = auth.currentUser;
        const userEmail = user ? user.email : 'System/Unknown';

        await addDoc(collection(db, COLLECTION_NAME), {
            action: actionType, // e.g. 'DELETE', 'UPDATE', 'RESTOCK'
            module: moduleName, // e.g. 'INVENTORY', 'TRANSACTION'
            documentId: documentId || '-',
            details: details || '-',
            performedBy: userEmail,
            timestamp: Timestamp.now()
        });
    } catch (error) {
        // Audit logs failing should ideally not break the main transaction flow, so we catch and warn.
        console.error("Failed to write audit log:", error);
    }
};

export const getAuditLogs = async (fetchLimit = 100) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(fetchLimit)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw error;
    }
};
