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
import { logAction } from './loggerService';

const COLLECTION_NAME = 'products';

export const getProducts = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const addProduct = async (productData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...productData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

export const updateProduct = async (id, productData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...productData,
            updatedAt: Timestamp.now()
        });
        await logAction('UPDATE', 'INVENTORY', id, `Updated product code/name: ${productData.name || id}`);
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
        await logAction('DELETE', 'INVENTORY', id, `Deleted product ID: ${id}`);
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

export const restockProduct = async (id, currentStock, addedQuantity, newBuyPrice, supplier = '-') => {
    try {
        const productRef = doc(db, COLLECTION_NAME, id);
        const logRef = collection(db, 'purchase_history');

        // 1. Log the purchase
        await addDoc(logRef, {
            productId: id,
            type: 'RESTOCK',
            quantityAdded: Number(addedQuantity),
            buyPrice: Number(newBuyPrice),
            totalCost: Number(addedQuantity) * Number(newBuyPrice),
            supplier: supplier,
            createdAt: Timestamp.now()
        });

        // 2. Update the master inventory
        await updateDoc(productRef, {
            stock: Number(currentStock) + Number(addedQuantity),
            buyPrice: Number(newBuyPrice), // Update HPP to latest buy price
            updatedAt: Timestamp.now()
        });
        await logAction('RESTOCK', 'INVENTORY', id, `Added +${addedQuantity} stock from ${supplier || 'Unknown Supplier'}`);
    } catch (error) {
        console.error("Error restocking:", error);
        throw error;
    }
};
