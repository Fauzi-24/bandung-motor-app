import React, { useState, useEffect, Fragment } from 'react';
import { getTransactions } from '../services/transactionService';
import { Calendar, Search, TrendingUp, DollarSign, Filter, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatIDR, formatDateIndo } from '../utils/formatUtils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

const Reports = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedRow, setExpandedRow] = useState(null);

    // Summary State
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalTransactions: 0
    });

    useEffect(() => {
        fetchTransactions();
    }, [startDate, endDate]);

    useEffect(() => {
        filterData();
    }, [transactions, startDate, endDate, searchTerm]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await getTransactions(startDate, endDate, 1000);

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

            console.log("RAW TRANSACTIONS:", enrichedData);
            console.log("RAW NAMES:", enrichedData.map(t => `${t.customerName} (${t.totalAmount})`));
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
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);

        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

        filtered = filtered.filter(t => {
            const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            const isMatch = tDate >= start && tDate <= end;
            if (t.customerName?.includes('Budi')) {
                console.log(`DEBUG BUDI: tDate=${tDate} start=${start} end=${end} match=${isMatch}`);
            }
            return isMatch;
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

        console.log("FILTERED COUNT:", filtered.length, "REASON:", searchTerm ? "search" : "date");
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

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            toast.error("Tidak ada data untuk diekspor");
            return;
        }

        const headers = ['ID Transaksi', 'Tanggal', 'Pelanggan', 'Kendaraan', 'Detail Item', 'Total Transaksi', 'Keuntungan'];
        const csvRows = [headers.join(',')];

        filteredTransactions.forEach(t => {
            const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            const dateStr = `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID')}`;

            const formatCsvStr = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
            const itemsStr = t.items.map(item => `${item.name} (${item.quantity}x)`).join('; ');

            const row = [
                formatCsvStr(t.id),
                formatCsvStr(dateStr),
                formatCsvStr(t.customerName),
                formatCsvStr(t.vehicleInfo),
                formatCsvStr(itemsStr),
                t.totalAmount || 0,
                t.profit || 0
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Bengkel_${startDate}_sd_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Laporan berhasil diekspor!");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6 text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Laporan Transaksi</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Rekap pendapatan dan keuntungan bengkel</p>
                </div>

                {/* Date Filter & Export */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 glass-dark p-3 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.1)] border border-[#00f0ff]/20">
                        <div className="flex items-center gap-2 px-2">
                            <Calendar size={18} className="text-[#00f0ff]" />
                            <span className="text-sm font-medium text-slate-300">Periode:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm border border-white/10 bg-black/40 rounded-lg px-3 py-1.5 outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 text-white [color-scheme:dark]"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm border border-white/10 bg-black/40 rounded-lg px-3 py-1.5 outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 text-white [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 px-4 py-3 sm:py-0 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#050510] border border-[#00f0ff]/30 hover:border-transparent rounded-xl transition-all shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] font-bold text-sm h-full self-stretch"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <motion.div variants={itemVariants} className="glass-panel p-6 border-[#00f0ff]/30 hover-card overflow-hidden relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00f0ff] to-[#0284c7] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Omzet</p>
                            <h3 className="text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">
                                Rp {formatIDR(summary.totalRevenue)}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#00f0ff]/10 text-[#00f0ff] rounded-xl border border-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel p-6 border-emerald-500/30 hover-card overflow-hidden relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Laba Bersih</p>
                            <h3 className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">
                                Rp {formatIDR(summary.totalProfit)}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel p-6 border-[#b026ff]/30 hover-card overflow-hidden relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#b026ff] to-[#7c3aed] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Transaksi</p>
                            <h3 className="text-2xl font-bold text-white drop-shadow-[0_0_5px_rgba(176,38,255,0.3)]">
                                {summary.totalTransactions}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#b026ff]/10 text-[#b026ff] rounded-xl border border-[#b026ff]/20 shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                            <Filter size={24} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Transaction List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel border-white/10 overflow-hidden relative z-10"
            >
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
                    <h2 className="font-bold text-white">Riwayat Transaksi</h2>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f0ff]" size={18} />
                        <input
                            type="text"
                            placeholder="Cari pelanggan / motor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00f0ff]/50 text-white placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black/40 text-slate-300 font-medium border-b border-white/10 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Kendaraan</th>
                                <th className="px-6 py-4 text-right">Total Belanja</th>
                                <th className="px-6 py-4 text-right">Keuntungan</th>
                                <th className="px-6 py-4 text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <LoadingSpinner label="Memuat data laporan..." />
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8">
                                        <EmptyState
                                            icon={FileText}
                                            title="Data tidak ditemukan"
                                            message={searchTerm ? `Tidak ditemukan transaksi dengan kata kunci "${searchTerm}"` : "Tidak ada data transaksi untuk rentang tanggal ini."}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                                    const isExpanded = expandedRow === t.id;

                                    return (
                                        <Fragment key={t.id}>
                                            <tr className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`} onClick={() => toggleRow(t.id)}>
                                                <td className="px-6 py-4 text-slate-300">
                                                    {formatDateIndo(tDate)}
                                                    <span className="text-slate-500 text-xs ml-2 font-mono">
                                                        {tDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">
                                                    {t.customerName || 'Umum'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 hidden sm:table-cell">
                                                    {t.vehicleInfo || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#00f0ff] drop-shadow-[0_0_2px_#00f0ff]">
                                                    Rp {formatIDR(t.totalAmount)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">
                                                    Rp {formatIDR(t.profit)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        className={`text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10 ${isExpanded ? 'bg-white/10 text-white' : ''}`}
                                                    >
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-black/50 overflow-hidden"
                                                    >
                                                        <td colSpan="6" className="px-6 py-4 border-b border-white/5">
                                                            <div className="glass-dark border border-white/10 rounded-xl p-4 shadow-inner">
                                                                <p className="text-xs font-bold text-[#b026ff] uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#b026ff] shadow-[0_0_5px_#b026ff]"></div>
                                                                    Rincian Barang / Jasa
                                                                </p>
                                                                <div className="grid gap-2">
                                                                    {t.items && t.items.map((item, idx) => (
                                                                        <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-white font-medium">{item.name}</span>
                                                                                <span className="text-slate-500 font-mono text-xs bg-black/40 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                                                                {item.type === 'service' && <span className="text-[10px] font-bold tracking-wider uppercase bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/30 px-1.5 py-0.5 rounded">Jasa</span>}
                                                                            </div>
                                                                            <span className="text-slate-300 font-bold tracking-wide">
                                                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between text-xs text-slate-400 font-medium">
                                                                    <span>Pembayaran: Tunai (Rp {t.cash?.toLocaleString('id-ID')})</span>
                                                                    <span>Kembalian: <span className="text-white">Rp {t.change?.toLocaleString('id-ID')}</span></span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div >
    );
};

export default Reports;
