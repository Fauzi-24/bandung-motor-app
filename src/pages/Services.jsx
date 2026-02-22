import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Save, Wrench } from 'lucide-react';
import { getServices, addService, updateService, deleteService } from '../services/serviceService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatIDR, cleanNumericValue } from '../utils/formatUtils';

const Services = () => {
    const { userRole } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const firstInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: ''
    });

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await getServices();
            setServices(data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handlePriceChange = (e) => {
        setFormData({ ...formData, price: cleanNumericValue(e.target.value) });
    };

    const handleOpenModal = (service = null) => {
        if (service) {
            setCurrentService(service);
            setFormData({
                name: service.name,
                category: service.category,
                price: service.price
            });
        } else {
            setCurrentService(null);
            setFormData({
                name: '',
                category: '',
                price: ''
            });
        }
        setIsModalOpen(true);
        setTimeout(() => firstInputRef.current?.focus(), 100);
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') handleCloseModal();
        };
        if (isModalOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentService(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: Number(formData.price) || 0
            };

            if (currentService) {
                await updateService(currentService.id, payload);
            } else {
                await addService(payload);
            }
            fetchServices();
            handleCloseModal();
            toast.success("Jasa berhasil disimpan!");
        } catch (error) {
            console.error("Error saving service:", error);
            toast.error("Error saving service: " + error.message);
        }
    };

    const confirmDelete = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await deleteService(deleteConfirm.id);
            fetchServices();
            toast.success("Jasa berhasil dihapus!");
        } catch (error) {
            toast.error("Error deleting service: " + error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-6 text-slate-200">
            <div className="flex justify-between items-end relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Daftar Harga & Jasa</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Kelola layanan dan tarif perbaikan</p>
                </div>
                {userRole === 'Owner' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-[#b026ff]/20 text-[#b026ff] hover:bg-[#b026ff] hover:text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(176,38,255,0.2)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)] border border-[#b026ff]/50 font-semibold"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Tambah Jasa</span>
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden border-[#b026ff]/20 shadow-[0_0_15px_rgba(176,38,255,0.1)] relative z-10">
                <div className="p-4 border-b border-white/10 flex gap-4 bg-black/20">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b026ff] drop-shadow-[0_0_5px_#b026ff]" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama atau kategori jasa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-slate-400 text-lg"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-black/40 text-slate-300 font-medium border-b border-white/10 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-xl whitespace-nowrap">Nama Jasa / Servis</th>
                                <th className="p-4 whitespace-nowrap">Kategori</th>
                                <th className="p-4 text-right whitespace-nowrap">Ongkos Jasa</th>
                                {userRole === 'Owner' && (
                                    <th className="p-4 text-center rounded-tr-xl whitespace-nowrap">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="divide-y divide-white/5"
                        >
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
                                        <LoadingSpinner label="Memuat layanan..." color="#b026ff" />
                                    </td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8">
                                        <EmptyState
                                            icon={Wrench}
                                            title={searchTerm ? "Jasa tidak ditemukan" : "Belum ada jasa"}
                                            message={searchTerm ? `Tidak ditemukan jasa dengan kata kunci "${searchTerm}"` : "Daftar jasa perbaikan Anda masih kosong. Silakan tambah jasa baru untuk mulai melayani pelanggan."}
                                            action={!searchTerm && userRole === 'Owner' && (
                                                <button
                                                    onClick={() => handleOpenModal()}
                                                    className="bg-[#b026ff]/20 text-[#b026ff] hover:bg-[#b026ff] hover:text-white px-6 py-2.5 rounded-xl transition-all border border-[#b026ff]/50 font-bold"
                                                >
                                                    Tambah Jasa Pertama
                                                </button>
                                            )}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <motion.tr variants={rowVariants} key={service.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-medium text-white group-hover:text-[#b026ff] transition-colors flex items-center gap-3">
                                            <div className="p-1.5 bg-[#b026ff]/10 rounded-lg text-[#b026ff] shadow-[0_0_10px_rgba(176,38,255,0.1)]">
                                                <Wrench size={18} />
                                            </div>
                                            {service.name}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/5">
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-[#00f0ff] font-bold tracking-wide drop-shadow-[0_0_2px_#00f0ff]">
                                            Rp {formatIDR(service.price)}
                                        </td>
                                        {userRole === 'Owner' && (
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(service)}
                                                        className="p-2 text-slate-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors border border-transparent hover:border-[#00f0ff]/30"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(service.id)}
                                                        className="p-2 text-slate-400 hover:text-[#ff007f] hover:bg-[#ff007f]/10 rounded-lg transition-colors border border-transparent hover:border-[#ff007f]/30"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass-dark rounded-2xl shadow-[0_0_40px_rgba(176,38,255,0.15)] border border-white/10 w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b026ff] via-[#00f0ff] to-[#ff007f]"></div>

                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
                                <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                    {currentService ? 'Edit Jasa' : 'Tambah Jasa Baru'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors p-1">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nama Jasa</label>
                                    <input
                                        type="text"
                                        required
                                        ref={firstInputRef}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#b026ff]/50 focus:ring-[#b026ff]/20"
                                        placeholder="Contoh: Servis Ringan, Ganti Ban"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#b026ff]/50 focus:ring-[#b026ff]/20 [&>option]:bg-[#050510] [&>option]:text-white"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        <option value="Servis Mesin">Servis Mesin</option>
                                        <option value="Servis Body">Servis Body</option>
                                        <option value="Kelistrikan">Kelistrikan</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Ongkos Jasa</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00f0ff] font-medium tracking-widest">Rp</span>
                                        <input
                                            type="text"
                                            required
                                            value={formatIDR(formData.price)}
                                            onChange={handlePriceChange}
                                            className="w-full pl-12 pr-4 py-2.5 rounded-xl input-primary font-bold text-[#00f0ff] focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-white/10 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-3 border border-white/20 text-slate-300 hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#b026ff] to-[#7c3aed] hover:from-[#d946ef] hover:to-[#9333ea] text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)] flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Hapus Jasa"
                message="Apakah Anda yakin ingin menghapus jasa ini? Tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
};

export default Services;
