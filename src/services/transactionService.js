import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDocsFromServer,
    query,
    orderBy,
    Timestamp,
    where,
    runTransaction,
    doc,
    limit
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
            const { createdAt, ...cleanData } = transactionData;
            const newTransactionRef = doc(collection(db, COLLECTION_NAME));
            transaction.set(newTransactionRef, {
                ...cleanData,
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

export const getTransactions = async (startDate = null, endDate = null, limitCount = 500) => {
    try {
        let qConstraints = [];

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            qConstraints = [
                where('createdAt', '>=', Timestamp.fromDate(start)),
                where('createdAt', '<=', Timestamp.fromDate(end)),
                orderBy('createdAt', 'desc')
            ];
        } else {
            // Default fallback if no dates provided: just get the latest to avoid crashing
            qConstraints = [
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            ];
        }

        const q = query(collection(db, COLLECTION_NAME), ...qConstraints);

        // Use getDocsFromServer to ensure we bypass potentially stale local cache
        const snapshot = await getDocsFromServer(q);
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

export const getCustomerHistory = async (customerName, licensePlate) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const allTransactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Case-insensitive inclusion search for better matches
        return allTransactions.filter(t => {
            const searchName = (customerName || '').toLowerCase().trim();
            const searchPlate = (licensePlate || '').toLowerCase().trim();

            const matchesName = t.customerName && t.customerName.toLowerCase().includes(searchName);
            const matchesVehicleInfo = searchPlate && t.vehicleInfo && t.vehicleInfo.toLowerCase().includes(searchPlate);

            return (searchName && matchesName) || (searchPlate && matchesVehicleInfo);
        });

    } catch (error) {
        console.error("Error fetching customer history:", error);
        throw error;
    }
};

export const getUniqueCustomersFromTransactions = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const customersMap = new Map();

        transactions.forEach(t => {
            if (!t.customerName) return;

            // Generate a unique key based on name and vehicle to group them
            // If vehicle is empty, use just the name
            const key = `${t.customerName.trim().toLowerCase()}_${(t.vehicleInfo || '').trim().toLowerCase()}`;

            if (!customersMap.has(key)) {
                customersMap.set(key, {
                    id: key, // Generate a faux-id for React keys
                    name: t.customerName.trim(),
                    licensePlate: t.vehicleInfo ? t.vehicleInfo.trim() : '',
                    vehicleModel: '', // We don't historically store model separately in transactions 
                    phone: '', // Phone isn't deeply tracked in early transactions
                    totalSpent: 0,
                    visitCount: 0,
                    lastVisit: t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
                });
            }

            const customer = customersMap.get(key);
            customer.totalSpent += (t.totalAmount || 0);
            customer.visitCount += 1;

            // Update last visit if this transaction is newer
            const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            if (tDate > customer.lastVisit) {
                customer.lastVisit = tDate;
            }
        });

        // Convert Map to Array and sort by lastVisit descending
        return Array.from(customersMap.values()).sort((a, b) => b.lastVisit - a.lastVisit);

    } catch (error) {
        console.error("Error generating unique customers:", error);
        throw error;
    }
};
