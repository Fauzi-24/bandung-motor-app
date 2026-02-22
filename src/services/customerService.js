import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    Timestamp,
    increment
} from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

export const getCustomers = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

export const addCustomer = async (customerData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...customerData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding customer:", error);
        throw error;
    }
};

export const updateCustomer = async (id, customerData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...customerData,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
};

export const deleteCustomer = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting customer:", error);
        throw error;
    }
};

// Save or Update Customer Profile (called during Checkout)
export const upsertCustomer = async (transactionData) => {
    if (!transactionData.customerName || Math.trim(transactionData.customerName) === '' || transactionData.customerName === 'Umum') {
        return; // Don't save generic walk-in customers
    }

    try {
        const name = transactionData.customerName.trim();
        const licensePlate = transactionData.vehicleInfo ? transactionData.vehicleInfo.trim() : '';

        // Generate a composite ID for simplicity (e.g. "budi-d1234ab") 
        const idBase = `${name}-${licensePlate}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        const docId = idBase || 'unknown';

        if (docId === 'unknown') return;

        const customerRef = doc(db, COLLECTION_NAME, docId);
        const customerSnap = await getDoc(customerRef);

        const tDate = transactionData.createdAt instanceof Timestamp ? transactionData.createdAt : Timestamp.now();

        if (customerSnap.exists()) {
            await updateDoc(customerRef, {
                totalSpent: increment(transactionData.totalAmount),
                visitCount: increment(1),
                lastVisit: tDate
            });
        } else {
            // Create new robust profile
            await setDoc(customerRef, {
                name: name,
                licensePlate: licensePlate,
                phone: '',
                totalSpent: transactionData.totalAmount,
                visitCount: 1,
                firstVisit: tDate,
                lastVisit: tDate
            });
        }
    } catch (error) {
        console.error("Error upserting customer:", error);
        // We catch but don't throw because failing to save a customer shouldn't crash the POS transaction
    }
};
