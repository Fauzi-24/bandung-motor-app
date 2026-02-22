import { useState, useEffect } from 'react';
import { getUniqueCustomersFromTransactions } from '../services/transactionService';
import { Search, Car, History, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CustomerHistoryModal from '../components/ui/CustomerHistoryModal';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await getUniqueCustomersFromTransactions();
            setCustomers(data);
        } catch (error) {
            toast.error('Gagal mengambil data pelanggan dari transaksi');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenHistory = (customer) => {
        setSelectedHistoryCustomer(customer);
        setIsHistoryModalOpen(true);
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.licensePlate && customer.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end animate-fade-in relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Riwayat & Profil Pelanggan</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Lookup riwayat kendaraan dan profil pelanggan</p>
                </div>
            </div>

            <div className="glass-panel p-4 flex items-center gap-3 relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-[#00f0ff]/20">
                <Search className="text-[#00f0ff] ml-2 drop-shadow-[0_0_5px_#00f0ff]" size={20} />
                <input
                    type="text"
                    placeholder="Cari nama pelanggan atau plat nomor (e.g D 1234 ABC)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 outline-none text-lg"
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] shadow-[0_0_15px_#00f0ff]"></div>
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20 glass-panel border-[#b026ff]/20 shadow-[0_0_20px_rgba(176,38,255,0.1)]">
                    <p className="text-slate-400 text-lg">Tidak ada riwayat ditemukan.</p>
                </div>
            ) : (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
                >
                    {filteredCustomers.map((customer) => (
                        <motion.div
                            key={customer.id}
                            variants={itemVariant}
                            className="glass-panel p-6 hover-card group border-white/5 relative overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00f0ff]/5 rounded-full blur-2xl group-hover:bg-[#00f0ff]/10 transition-colors"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="font-bold text-xl text-white group-hover:text-[#00f0ff] transition-colors drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">{customer.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                                        <span className="text-sm font-medium">Total Kedatangan: <span className="text-white font-bold">{customer.visitCount}x</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 relative z-10 grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Car size={14} className="text-[#b026ff]" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Kendaraan</span>
                                    </div>
                                    <p className="text-sm font-bold text-white uppercase truncate">
                                        {customer.licensePlate || '-'}
                                    </p>
                                </div>

                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <TrendingUp size={14} className="text-[#00f0ff]" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Total Belanja</span>
                                    </div>
                                    <p className="text-sm font-bold text-white truncate">
                                        Rp {customer.totalSpent.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <p className="text-xs text-slate-500 w-full text-center flex justify-center items-center gap-1.5 border-b border-white/5 pb-3">
                                    <Clock size={12} /> Terakhir: {customer.lastVisit.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                <button
                                    onClick={() => handleOpenHistory(customer)}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all border border-[#00f0ff]/20 bg-[#00f0ff]/5 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#050510] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                >
                                    <History size={16} />
                                    Lihat Riwayat
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <CustomerHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                customerName={selectedHistoryCustomer?.name}
                licensePlate={selectedHistoryCustomer?.licensePlate}
            />
        </div>
    );
};

export default Customers;
