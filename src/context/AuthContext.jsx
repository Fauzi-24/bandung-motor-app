import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // Try to find the matching employee by email to get their role
                    const q = query(collection(db, 'employees'), where('email', '==', currentUser.email));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const employeeDoc = snapshot.docs[0];
                        const employeeData = employeeDoc.data();
                        setUserRole(employeeData.role || 'Kasir'); // Default to Kasir if no role found but email matches
                        setEmployeeId(employeeDoc.id);
                    } else {
                        // If not found in employees (e.g., the root admin), default to Owner
                        setUserRole('Owner');
                        setEmployeeId(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUserRole('Kasir'); // Safe fallback
                    setEmployeeId(null);
                }
            } else {
                setUserRole(null);
                setEmployeeId(null);
            }
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        userRole,
        employeeId,
        loading,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
