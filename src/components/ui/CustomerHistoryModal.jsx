import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, PenTool, Calendar, Car, TrendingUp } from 'lucide-react';
import { getCustomerHistory } from '../../services/transactionService';
import toast from 'react-hot-toast';
import { formatIDR, formatDateIndo } from '../../utils/formatUtils';

const CustomerHistoryModal = ({ isOpen, onClose, customerName, licensePlate }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && (customerName || licensePlate)) {
            fetchHistory();
        }
    }, [isOpen, customerName, licensePlate]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await getCustomerHistory(customerName || '', licensePlate || '');
            setHistory(data);
        } catch (error) {
            toast.error("Gagal mengambil riwayat transaksi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass-dark w-full max-w-2xl rounded-2xl shadow-[0_0_40px_rgba(176,38,255,0.15)] border border-white/10 overflow-hidden relative flex flex-col max-h-[90vh]"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b026ff] to-[#00f0ff]"></div>

                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
                        <div>
                            <h3 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                Profil & Riwayat Servis
                            </h3>
                            <p className="text-sm font-medium text-[#00f0ff] tracking-wide mt-1">
                                {customerName || 'Pelanggan'} {licensePlate ? `- ${licensePlate.toUpperCase()}` : ''}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b026ff] shadow-[0_0_15px_#b026ff]"></div>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 glass-panel border-white/5 bg-white/5">
                                <History size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
                                <p className="text-slate-400">Belum ada riwayat servis yang tercatat.</p>
                                <p className="text-xs text-slate-500 mt-2 italic">Pastikan nama pelanggan atau plat nomor sesuai dengan transaksi sebelumnya.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                {history.map((transaction) => (
                                    <div key={transaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Timeline Node */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/50 backdrop-blur-md shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-[#b026ff] group-hover:bg-[#b026ff]/20 group-hover:border-[#b026ff]/50 transition-colors z-10">
                                            <PenTool size={16} />
                                        </div>

                                        {/* Content Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 border-white/5 group-hover:border-[#b026ff]/30 transition-colors rounded-xl flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                                            <div className="flex items-center justify-between space-x-2 mb-2">
                                                <div className="flex items-center gap-2 text-[#00f0ff] font-bold text-sm bg-[#00f0ff]/10 px-2.5 py-1 rounded-md">
                                                    <Calendar size={14} />
                                                    {formatDateIndo(transaction.createdAt?.toDate ? transaction.createdAt.toDate() : transaction.createdAt)}
                                                </div>
                                                <span className="text-xs font-mono text-slate-500">#{transaction.id.slice(-6)}</span>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">Rincian Pekerjaan</p>
                                                <ul className="space-y-1.5 pt-1">
                                                    {transaction.items && transaction.items.map((item, i) => (
                                                        <li key={i} className="flex justify-between text-sm">
                                                            <span className="text-slate-300 flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'service' ? 'bg-[#ff007f]' : 'bg-[#00f0ff]'}`}></span>
                                                                <span className="truncate max-w-[120px] sm:max-w-[180px]" title={item.name}>{item.name}</span>
                                                                {item.quantity > 1 && <span className="text-slate-500 text-xs text-nowrap">x{item.quantity}</span>}
                                                            </span>
                                                            <span className="font-mono text-slate-400">Rp {formatIDR(item.price * (item.quantity || 1))}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-end">
                                                <span className="text-xs text-slate-500">Total Biaya</span>
                                                <span className="text-lg font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                                                    Rp {formatIDR(transaction.totalAmount || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CustomerHistoryModal;
