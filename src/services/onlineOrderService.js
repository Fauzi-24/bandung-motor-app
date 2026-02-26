import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    where,
    runTransaction
} from 'firebase/firestore';

const COLLECTION_NAME = 'online_orders';

export const subscribeToActiveOrders = (callback) => {
    // Listen for orders that are not yet COMPLETED or CANCELLED
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'MENUNGGU_PENGAMBILAN')
    );

    return onSnapshot(q, (snapshot) => {
        const orderData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort by createdAt ascending in memory to avoid needing a Firestore composite index
        orderData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeA - timeB;
        });

        callback(orderData);
    }, (error) => {
        console.error("Error listening to online orders:", error);
    });
};

export const placeOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...orderData,
            status: 'MENUNGGU_PENGAMBILAN',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error placing online order:", error);
        throw error;
    }
};

export const cancelOrder = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status: 'DIBATALKAN',
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
    }
};

export const completeOrder = async (orderId, orderData) => {
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 1. Check stock availability for products just in case someone bought it offline
            for (const item of orderData.items) {
                const productRef = doc(db, 'products', item.productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`Product ${item.name} does not exist!`);
                }

                const newStock = productDoc.data().stock - item.quantity;
                if (newStock < 0) {
                    throw new Error(`Stok ${item.name} tidak cukup saat ini! Sisa: ${productDoc.data().stock}`);
                }

                // 2. Deduct stock
                transaction.update(productRef, { stock: newStock });
            }

            // 3. Mark the online order as completed
            const orderRef = doc(db, COLLECTION_NAME, orderId);
            transaction.update(orderRef, {
                status: 'SELESAI',
                updatedAt: Timestamp.now()
            });

            // 4. Record as an actual transaction in the system
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                vehicleInfo: 'Pembelian Langsung', // Default for parts only
                items: orderData.items,
                totalAmount: orderData.totalAmount,
                paymentMethod: 'Tunai', // Default for instore pickup
                createdAt: Timestamp.now(),
                type: 'Online Order Pickup'
            });

            return transactionRef.id;
        });

        return result;
    } catch (error) {
        console.error("Error completing online order:", error);
        throw error;
    }
};
