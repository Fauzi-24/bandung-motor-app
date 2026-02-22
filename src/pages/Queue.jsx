import React, { useState, useEffect } from 'react';
import { Kanban, Plus, User, Wrench, Clock, CheckCircle2, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscribeToQueue, addQueueItem, updateQueueStatus, deleteQueueItem } from '../services/queueService';
import { getEmployees } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Queue = () => {
    const { userRole } = useAuth();
    const [queues, setQueues] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        vehicleInfo: '',
        mechanicId: '',
        mechanicName: '',
        description: ''
    });

    useEffect(() => {
        // Fetch mechanics for the assignment dropdown
        const fetchMechs = async () => {
            try {
                const emps = await getEmployees();
                setMechanics(emps.filter(e => e.role === 'Mekanik'));
            } catch (error) {
                console.error("Error fetching mechanics:", error);
            }
        };
        fetchMechs();

        // Real-time listener for the Kanban board
        const unsubscribe = subscribeToQueue((data) => {
            setQueues(data);
        });

        return () => unsubscribe();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerName || !formData.vehicleInfo || !formData.mechanicId) {
            return toast.error("Mohon lengkapi data pelanggan, motor, dan mekanik.");
        }

        try {
            await addQueueItem({
                customerName: formData.customerName,
                vehicleInfo: formData.vehicleInfo,
                mechanicId: formData.mechanicId,
                mechanicName: formData.mechanicName,
                description: formData.description || '-'
            });
            toast.success("Antrean berhasil ditambahkan!");
            setIsModalOpen(false);
            setFormData({ customerName: '', vehicleInfo: '', mechanicId: '', mechanicName: '', description: '' });
        } catch (error) {
            toast.error("Gagal menambah antrean");
        }
    };

    const handleStatusMove = async (id, currentStatus, direction) => {
        const flow = ['Menunggu', 'Dikerjakan', 'Selesai'];
        const currentIndex = flow.indexOf(currentStatus);
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < flow.length) {
            try {
                await updateQueueStatus(id, flow[newIndex]);
            } catch (error) {
                toast.error("Gagal update status");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Hapus antrean ini?")) {
            try {
                await deleteQueueItem(id);
                toast.success("Dihapus");
            } catch (error) {
                toast.error("Gagal menghapus");
            }
        }
    };

    const renderColumn = (title, status, icon, borderColor, bgGradient) => {
        const columnItems = queues.filter(q => q.status === status);

        return (
            <div className={`flex-1 flex flex-col glass-dark rounded-2xl border-t-4 ${borderColor} overflow-hidden shadow-lg h-full max-h-full`}>
                <div className={`p-4 ${bgGradient} border-b border-white/10 flex justify-between items-center`}>
                    <h2 className="font-bold text-lg text-white flex items-center gap-2">
                        {icon} {title}
                    </h2>
                    <span className="bg-black/40 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/10">
                        {columnItems.length}
                    </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 bg-black/10">
                    <AnimatePresence>
                        {columnItems.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-slate-800 border border-white/5 rounded-xl p-4 shadow-md relative group hover:border-white/20 transition-all"
                            >
                                <div className="absolute top-3 right-3 flex gap-1">
                                    {(userRole === 'Owner' || userRole === 'Kasir') && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <h3 className="font-bold text-white text-lg mb-1 pr-8">{item.vehicleInfo}</h3>
                                <p className="text-sm text-slate-400 mb-3 flex items-center gap-1"><User size={14} /> {item.customerName}</p>

                                <div className="bg-black/30 p-2 rounded-lg border border-white/5 mb-4">
                                    <p className="text-xs text-slate-500 mb-1">Mekanik Assignment:</p>
                                    <p className="text-sm font-semibold text-[#00f0ff] flex items-center gap-2">
                                        <Wrench size={14} /> {item.mechanicName}
                                    </p>
                                    {item.description && item.description !== '-' && (
                                        <p className="text-xs text-amber-200/70 mt-2 italic">"{item.description}"</p>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => handleStatusMove(item.id, status, 'prev')}
                                        disabled={status === 'Menunggu'}
                                        className={`p-1.5 rounded-lg transition-colors ${status === 'Menunggu' ? 'opacity-0 cursor-default' : 'bg-white/5 text-slate-300 hover:bg-white/20'}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.createdAt?.toMillis() || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button
                                        onClick={() => handleStatusMove(item.id, status, 'next')}
                                        disabled={status === 'Selesai'}
                                        className={`p-1.5 rounded-lg transition-colors ${status === 'Selesai' ? 'opacity-0 cursor-default' : 'bg-white/5 text-slate-300 hover:bg-white/20 hover:text-[#00f0ff]'}`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {columnItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-10">
                            <Kanban size={48} className="mb-2" />
                            <p className="text-sm">Kosong</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col text-slate-200">
            <div className="flex justify-between items-end mb-6 shrink-0 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Antrean Servis</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Kanban Board Real-time Mekanik</p>
                </div>
                {(userRole === 'Owner' || userRole === 'Kasir') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#b026ff]/20 text-[#b026ff] hover:bg-[#b026ff] hover:text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(176,38,255,0.2)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)] border border-[#b026ff]/50 font-bold"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Tambah Antrean</span>
                    </button>
                )}
            </div>

            {/* Kanban Board Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden pb-4">
                {renderColumn('Menunggu', 'Menunggu', <Clock size={20} className="text-amber-400" />, 'border-amber-400', 'bg-amber-400/10')}
                {renderColumn('Dikerjakan', 'Dikerjakan', <Wrench size={20} className="text-[#00f0ff]" />, 'border-[#00f0ff]', 'bg-[#00f0ff]/10')}
                {renderColumn('Selesai', 'Selesai', <CheckCircle2 size={20} className="text-emerald-400" />, 'border-emerald-400', 'bg-emerald-400/10')}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Kanban className="text-[#b026ff]" size={24} />
                                    Input Antrean Baru
                                </h3>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nama / Plat Motor</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.vehicleInfo}
                                        onChange={e => setFormData({ ...formData, vehicleInfo: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary"
                                        placeholder="Vario Hitam D 1234 XY"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nama Pelanggan / Nomor HP</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.customerName}
                                        onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary"
                                        placeholder="Bpk Budi / 0812XXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Pilih Mekanik</label>
                                    <select
                                        required
                                        value={formData.mechanicId}
                                        onChange={(e) => {
                                            const mech = mechanics.find(m => m.id === e.target.value);
                                            setFormData({ ...formData, mechanicId: mech?.id || '', mechanicName: mech?.name || '' });
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary bg-slate-800"
                                    >
                                        <option value="">Pilih...</option>
                                        {mechanics.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Catatan Keluhan (Opsional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary h-20 resize-none"
                                        placeholder="Ganti oli dan cek CVT bunyi decit..."
                                    />
                                </div>
                                <div className="mt-8 pt-4 border-t border-white/10 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 border border-white/20 text-slate-300 hover:bg-white/5 rounded-xl transition-all"
                                    > Batal </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#b026ff] to-[#7c1cf5] hover:to-[#5c13bd] text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                                    > Simpan Antrean </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Queue;
