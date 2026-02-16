import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    Timestamp,
    where,
    runTransaction,
    doc
} from 'firebase/firestore';

const COLLECTION_NAME = 'transactions';

export const saveTransaction = async (transactionData) => {
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 1. Check stock availability for products
            for (const item of transactionData.items) {
                if (item.type === 'product') {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);

                    if (!productDoc.exists()) {
                        throw new Error(`Product ${item.name} does not exist!`);
                    }

                    const newStock = productDoc.data().stock - item.quantity;
                    if (newStock < 0) {
                        throw new Error(`Stok ${item.name} tidak cukup! Sisa: ${productDoc.data().stock}`);
                    }

                    // 2. Deduct stock
                    transaction.update(productRef, { stock: newStock });
                }
            }

            // 3. Save the Transaction Record
            const newTransactionRef = doc(collection(db, COLLECTION_NAME));
            transaction.set(newTransactionRef, {
                ...transactionData,
                createdAt: Timestamp.now()
            });

            return newTransactionRef.id;
        });

        return result;
    } catch (error) {
        console.error("Error saving transaction:", error);
        throw error;
    }
};

export const getTransactions = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
    }
};

export const getEmployeePerformance = async (employeeId, startDate, endDate) => {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, COLLECTION_NAME),
            where('createdAt', '>=', Timestamp.fromDate(start)),
            where('createdAt', '<=', Timestamp.fromDate(end)),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(doc => doc.data());

        let totalServices = 0;
        let totalRevenueGenerated = 0;

        transactions.forEach(t => {
            if (t.items) {
                t.items.forEach(item => {
                    if (item.type === 'service' && item.mechanicId === employeeId) {
                        totalServices++;
                        totalRevenueGenerated += (item.price * item.quantity);
                    }
                });
            }
        });

        return {
            totalServices,
            totalRevenueGenerated,
            estimatedWage: totalRevenueGenerated * 0.4 // 40% Commission
        };
    } catch (error) {
        console.error("Error calculating performance:", error);
        throw error;
    }
};
