import { useState, useEffect } from 'react';
import { getTransactions } from '../services/transactionService';
import { Calendar, Search, TrendingUp, DollarSign, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const Reports = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    // Summary State
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalTransactions: 0
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        filterData();
    }, [transactions, startDate, endDate, searchTerm]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await getTransactions();

            // Enrich data with profit calculation
            const enrichedData = data.map(t => {
                let profit = 0;
                if (t.items && Array.isArray(t.items)) {
                    t.items.forEach(item => {
                        const qty = item.quantity || 1;
                        const totalItemPrice = item.price * qty;

                        if (item.type === 'product') {
                            const buyPrice = item.buyPrice || 0;
                            profit += (item.price - buyPrice) * qty;
                        } else if (item.type === 'service') {
                            const commission = totalItemPrice * 0.4;
                            profit += totalItemPrice - commission;
                        }
                    });
                }
                return { ...t, profit };
            });

            setTransactions(enrichedData);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let filtered = [...transactions];

        // Date Filter
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(t => {
            const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return tDate >= start && tDate <= end;
        });

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                (t.customerName && t.customerName.toLowerCase().includes(lowerTerm)) ||
                (t.vehicleInfo && t.vehicleInfo.toLowerCase().includes(lowerTerm)) ||
                (t.id && t.id.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredTransactions(filtered);

        // Calculate Summary
        const totalRev = filtered.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const totalProf = filtered.reduce((sum, t) => sum + (t.profit || 0), 0);

        setSummary({
            totalRevenue: totalRev,
            totalProfit: totalProf,
            totalTransactions: filtered.length
        });
    };

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Transaksi</h1>
                    <p className="text-gray-500 text-sm mt-1">Rekap pendapatan dan keuntungan bengkel</p>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Periode:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Omzet</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                Rp {summary.totalRevenue.toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Laba Bersih</p>
                            <h3 className="text-2xl font-bold text-green-600">
                                Rp {summary.totalProfit.toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {summary.totalTransactions}
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Filter size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center gap-4">
                    <h2 className="font-bold text-gray-800">Riwayat Transaksi</h2>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama pelanggan / motor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Pelanggan</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Kendaraan</th>
                                <th className="px-6 py-3 text-right">Total Belanja</th>
                                <th className="px-6 py-3 text-right">Keuntungan</th>
                                <th className="px-6 py-3 text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada transaksi ditemukan pada periode ini.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                                    const isExpanded = expandedRow === t.id;

                                    return (
                                        <>
                                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-gray-600">
                                                    {tDate.toLocaleDateString('id-ID')}
                                                    <span className="text-gray-400 text-xs ml-2">
                                                        {tDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {t.customerName || 'Umum'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                                                    {t.vehicleInfo || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-800">
                                                    Rp {t.totalAmount?.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-green-600">
                                                    Rp {t.profit?.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleRow(t.id)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan="6" className="px-6 py-4">
                                                        <div className="bg-white border rounded-lg p-4 space-y-2">
                                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rincian Barang / Jasa</p>
                                                            <div className="grid gap-2">
                                                                {t.items && t.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between text-sm">
                                                                        <div className="flex gap-2">
                                                                            <span className="text-gray-800 font-medium">{item.name}</span>
                                                                            <span className="text-gray-500">x{item.quantity}</span>
                                                                            {item.type === 'service' && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Jasa</span>}
                                                                        </div>
                                                                        <span className="text-gray-600">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="border-t pt-2 mt-2 flex justify-between text-sm text-gray-500">
                                                                <span>Pembayaran: Tunai (Rp {t.cash?.toLocaleString('id-ID')})</span>
                                                                <span>Kembalian: Rp {t.change?.toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
