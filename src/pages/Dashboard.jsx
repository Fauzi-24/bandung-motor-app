import { useState, useEffect } from 'react';
import { getTransactions } from '../services/transactionService';
import { getProducts } from '../services/inventoryService';
import { DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';


const Dashboard = () => {
    const [stats, setStats] = useState({
        todayIncome: 0,
        todayProfit: 0,
        todayCustomers: 0,
        lowStockCount: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [transactions, products] = await Promise.all([
                    getTransactions(),
                    getProducts()
                ]);

                // Calculate Today's Stats
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let income = 0;
                let profit = 0;
                let customers = 0;

                transactions.forEach(t => {
                    // Handle Firestore Timestamp
                    const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                    if (tDate >= today) {
                        income += t.totalAmount;
                        customers += 1;
                    }
                    if (tDate >= today) {
                        income += t.totalAmount;
                        customers += 1;

                        // Calculate Profit for this transaction
                        if (t.items && Array.isArray(t.items)) {
                            t.items.forEach(item => {
                                const qty = item.quantity || 1;
                                const totalItemPrice = item.price * qty;

                                if (item.type === 'product') {
                                    // Profit = Sell Price - Buy Price
                                    const buyPrice = item.buyPrice || 0;
                                    const itemProfit = (item.price - buyPrice) * qty;
                                    profit += itemProfit;
                                } else if (item.type === 'service') {
                                    // Profit = Service Price - 40% Commission (Wage)
                                    // So we keep 60%
                                    const commission = totalItemPrice * 0.4;
                                    const itemProfit = totalItemPrice - commission;
                                    profit += itemProfit;
                                }
                            });
                        }
                    }
                });

                // Calculate Low Stock
                const lowStock = products.filter(p => p.stock <= 5).length;

                setStats({
                    todayIncome: income,
                    todayProfit: profit,
                    todayCustomers: customers,
                    lowStockCount: lowStock
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">


            <div className="flex justify-between items-end animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Ringkasan aktivitas bengkel hari ini</p>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Status Toko</p>
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full mt-1 border border-green-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Buka
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Income Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover-card group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Omzet</p>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                <span className="text-lg font-medium text-slate-400 align-top mr-1">Rp</span>
                                {stats.todayIncome.toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
                        <span className="font-semibold">Hari Ini</span>
                    </div>
                </div>

                {/* Profit Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 hover-card group text-white relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-blue-100 mb-1">Laba Bersih</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                <span className="text-lg font-medium text-blue-200 align-top mr-1">Rp</span>
                                {stats.todayProfit.toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm border border-white/20">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-white/90 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="font-medium">Keuntungan Murni</span>
                    </div>
                </div>

                {/* Customers Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover-card group relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Pelanggan</p>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                {stats.todayCustomers}
                                <span className="text-base font-medium text-slate-400 ml-1">Orang</span>
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        <span>Total transaksi hari ini</span>
                    </div>
                </div>

                {/* Low Stock Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover-card group relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-1 bg-gradient-to-b ${stats.lowStockCount > 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-green-500'} h-full`}></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Stok Menipis</p>
                            <h3 className={`text-3xl font-bold tracking-tight ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {stats.lowStockCount}
                                <span className="text-base font-medium text-slate-400 ml-1">Item</span>
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl transition-colors shadow-sm ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        {stats.lowStockCount > 0 ? <span className="text-red-500 font-medium">Perlu restock segera!</span> : <span>Stok aman terkendali</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
