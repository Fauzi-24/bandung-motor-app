import React, { useState, useEffect } from 'react';
import { Package, Search, CheckCircle2, XCircle, Clock, ShoppingBag, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeToActiveOrders, completeOrder, cancelOrder } from '../services/onlineOrderService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const OnlineOrders = () => {
    const { userRole } = useAuth();
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToActiveOrders((data) => {
            setOrders(data);
        });

        return () => unsubscribe();
    }, []);

    const filteredOrders = orders.filter(o => {
        const cName = String(o?.customerName || '').toLowerCase();
        const cPhone = String(o?.customerPhone || '').toLowerCase();
        const idStr = String(o?.id || '').toLowerCase();
        const queryStr = String(searchQuery || '').toLowerCase();
        return cName.includes(queryStr) || cPhone.includes(queryStr) || idStr.includes(queryStr);
    });

    const handleComplete = async (orderId, orderData) => {
        if (!window.confirm(`Konfirmasi pembayaran selesai untuk pesanan ${orderData.customerName}? Ini akan memotong stok barang dan mencatat transaksi.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            await completeOrder(orderId, orderData);
            toast.success("Pesanan telah diselesaikan dan dicatat sebagai transaksi.");
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Gagal menyelesaikan pesanan");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async (orderId, customerName) => {
        if (!window.confirm(`Yakin ingin membatalkan pesanan dari ${customerName}?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            await cancelOrder(orderId);
            toast.success("Pesanan dibatalkan.");
        } catch (error) {
            console.error(error);
            toast.error("Gagal membatalkan pesanan.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col text-slate-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 shrink-0 relative z-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] flex items-center gap-3">
                        <ShoppingBag className="text-[#b026ff]" size={32} />
                        Pesanan Online
                    </h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Pantau dan selesaikan pesanan dari pelanggan</p>
                </div>

                <div className="w-full sm:w-auto relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00f0ff] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, no HP, atau ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-80 pl-10 pr-4 py-2.5 rounded-xl input-primary"
                    />
                </div>
            </div>

            {/* Orders List / Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar pb-4">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <Package size={64} className="mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Belum ada pesanan aktif</h3>
                        <p>Pesanan baru akan otomatis muncul di sini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredOrders.map(order => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-slate-900 border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.05)] hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all flex flex-col relative overflow-hidden"
                                >
                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 rounded-bl-full -mr-8 -mt-8 blur-2xl pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-4 relative z-10 border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                                <User size={16} className="text-[#00f0ff]" />
                                                {order.customerName}
                                            </h3>
                                            <p className="text-sm text-slate-400 font-mono mt-1">{order.customerPhone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                                                <Clock size={12} />
                                                Menunggu
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                ID: {order.id.substring(0, 6).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2 relative z-10 mb-4 bg-black/30 p-3 rounded-xl border border-white/5">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-center">
                                                <span className="text-slate-300">
                                                    {item.name} <span className="text-slate-500">x{item.quantity}</span>
                                                </span>
                                                <span className="font-semibold text-white">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-end relative z-10 mt-auto pt-4 border-t border-white/10">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Total Pembayaran</p>
                                            <p className="text-xl font-bold text-[#b026ff] drop-shadow-[0_0_5px_rgba(176,38,255,0.5)] mt-1">
                                                Rp {order.totalAmount.toLocaleString('id-ID')}
                                            </p>
                                        </div>

                                        {(userRole === 'Kasir' || userRole === 'Owner') && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCancel(order.id, order.customerName)}
                                                    disabled={isProcessing}
                                                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/30 transition-all disabled:opacity-50"
                                                    title="Batalkan"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(order.id, order)}
                                                    disabled={isProcessing}
                                                    className="p-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl border border-emerald-500/30 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] disabled:opacity-50 flexitems-center gap-2"
                                                    title="Selesaikan & Bayar"
                                                >
                                                    <CheckCircle2 size={20} />
                                                    <span className="font-bold pr-1">Selesai</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineOrders;
