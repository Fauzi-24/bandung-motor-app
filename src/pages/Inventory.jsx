import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Save, Package } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/inventoryService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatIDR, cleanNumericValue } from '../utils/formatUtils';

const Inventory = () => {
    const { userRole } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const firstInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: '',
        stock: '',
        buyPrice: '',
        sellPrice: ''
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handlePriceChange = (e, field) => {
        setFormData({ ...formData, [field]: cleanNumericValue(e.target.value) });
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                code: product.code || '',
                name: product.name,
                category: product.category || '',
                stock: product.stock,
                buyPrice: product.buyPrice ?? product.costPrice ?? '',
                sellPrice: product.sellPrice ?? ''
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                code: '',
                name: '',
                category: '',
                stock: '',
                buyPrice: '',
                sellPrice: ''
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
        setCurrentProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                stock: Number(formData.stock) || 0,
                buyPrice: Number(formData.buyPrice) || 0,
                sellPrice: Number(formData.sellPrice) || 0
            };

            if (currentProduct) {
                await updateProduct(currentProduct.id, payload);
            } else {
                await addProduct(payload);
            }
            fetchProducts();
            handleCloseModal();
            toast.success("Barang berhasil disimpan!");
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error(`Gagal menyimpan barang: ${error.message}`);
        }
    };

    const confirmDelete = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await deleteProduct(deleteConfirm.id);
            fetchProducts();
            toast.success("Barang berhasil dihapus!");
        } catch (error) {
            toast.error("Error deleting product: " + error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const filteredProducts = products.filter(product =>
        (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Manajemen Inventaris</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Kelola stok sparepart dan aksesoris</p>
                </div>
                {userRole === 'Owner' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#050510] px-4 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] border border-[#00f0ff]/50 font-semibold"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Tambah Barang</span>
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden border-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.1)] relative z-10">
                <div className="p-4 border-b border-white/10 flex gap-4 bg-black/20">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama barang atau kode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-slate-400 text-lg"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left table-fixed">
                        <colgroup>
                            <col className="w-[90px]" />
                            <col className="w-[36%]" />
                            <col className="w-[18%]" />
                            <col className="w-[80px]" />
                            {userRole === 'Owner' && <col className="w-[15%]" />}
                            <col className="w-[15%]" />
                            {userRole === 'Owner' && <col className="w-[90px]" />}
                        </colgroup>
                        <thead className="bg-black/40 text-slate-300 font-medium border-b border-white/10 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-xl">Kode</th>
                                <th className="p-4">Nama Barang</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4 text-center">Stok</th>
                                {userRole === 'Owner' && (
                                    <th className="p-4 text-right">Harga Beli</th>
                                )}
                                <th className="p-4 text-right">Harga Jual</th>
                                {userRole === 'Owner' && (
                                    <th className="p-4 text-center rounded-tr-xl">Aksi</th>
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
                                    <td colSpan="7" className="p-12 text-center">
                                        <LoadingSpinner label="Memuat inventaris..." />
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8">
                                        <EmptyState
                                            icon={Package}
                                            title={searchTerm ? "Barang tidak ditemukan" : "Belum ada barang"}
                                            message={searchTerm ? `Tidak ditemukan barang dengan kata kunci "${searchTerm}"` : "Stok barang Anda masih kosong. Silakan tambah barang baru untuk mulai mengelola inventaris."}
                                            action={!searchTerm && userRole === 'Owner' && (
                                                <button
                                                    onClick={() => handleOpenModal()}
                                                    className="bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#050510] px-6 py-2.5 rounded-xl transition-all border border-[#00f0ff]/50 font-bold"
                                                >
                                                    Tambah Barang Pertama
                                                </button>
                                            )}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const buyP = product.buyPrice ?? product.costPrice ?? 0;
                                    const sellP = product.sellPrice ?? 0;
                                    const stok = product.stock ?? 0;
                                    return (
                                        <motion.tr variants={rowVariants} key={product.id} className="hover:bg-white/5 transition-colors group">
                                            {/* Kode */}
                                            <td className="p-4 font-mono text-sm text-[#bae6fd] opacity-70 group-hover:opacity-100 truncate">
                                                {product.code || '—'}
                                            </td>
                                            {/* Nama */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-1.5 bg-[#00f0ff]/10 rounded-lg text-[#00f0ff] flex-shrink-0">
                                                        <Package size={14} />
                                                    </div>
                                                    <span className="font-medium text-white group-hover:text-[#00f0ff] transition-colors truncate" title={product.name}>
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Kategori */}
                                            <td className="p-4">
                                                <span className="bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/5 truncate block max-w-full">
                                                    {product.category || '—'}
                                                </span>
                                            </td>
                                            {/* Stok */}
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${stok <= 5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                                                    {stok}
                                                </span>
                                            </td>
                                            {/* Harga Beli (Owner only) */}
                                            {userRole === 'Owner' && (
                                                <td className="p-4 text-right text-slate-400 text-sm">
                                                    {formatIDR(buyP)}
                                                </td>
                                            )}
                                            {/* Harga Jual */}
                                            <td className="p-4 text-right text-[#00f0ff] font-bold text-sm drop-shadow-[0_0_2px_#00f0ff]">
                                                {formatIDR(sellP)}
                                            </td>
                                            {/* Aksi (Owner only) */}
                                            {userRole === 'Owner' && (
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenModal(product)}
                                                            className="p-2 text-slate-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors border border-transparent hover:border-[#00f0ff]/30"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(product.id)}
                                                            className="p-2 text-slate-400 hover:text-[#ff007f] hover:bg-[#ff007f]/10 rounded-lg transition-colors border border-transparent hover:border-[#ff007f]/30"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </motion.tr>
                                    );
                                })
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
                            className="glass-dark rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] border border-white/10 w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] via-[#b026ff] to-[#ff007f]"></div>

                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
                                <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                    {currentProduct ? 'Edit Barang' : 'Tambah Barang Baru'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors p-1">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Kode Barang</label>
                                        <input
                                            type="text"
                                            required
                                            ref={firstInputRef}
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl input-primary"
                                            placeholder="Contoh: B001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Kategori</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl input-primary"
                                            placeholder="Contoh: Oli"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nama Barang</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary"
                                        placeholder="Contoh: Yamalube Sport 1L"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Harga Beli (Modal)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium tracking-widest">Rp</span>
                                            <input
                                                type="text"
                                                required
                                                value={formatIDR(formData.buyPrice)}
                                                onChange={e => handlePriceChange(e, 'buyPrice')}
                                                className="w-full pl-12 pr-4 py-2.5 rounded-xl input-primary"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Harga Jual</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00f0ff] font-medium tracking-widest">Rp</span>
                                            <input
                                                type="text"
                                                required
                                                value={formatIDR(formData.sellPrice)}
                                                onChange={e => handlePriceChange(e, 'sellPrice')}
                                                className="w-full pl-12 pr-4 py-2.5 rounded-xl input-primary font-bold text-[#00f0ff] focus:ring-[#00f0ff]/50"
                                                placeholder="0"
                                            />
                                        </div>
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
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00f0ff] to-[#0284c7] hover:from-[#00f0ff] hover:to-[#0ea5e9] text-[#050510] font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2"
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
                title="Hapus Barang"
                message="Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
};

export default Inventory;
