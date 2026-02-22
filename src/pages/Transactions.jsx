import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Trash2, Plus, Minus, User, Save, Printer, History } from 'lucide-react';
import { getProducts } from '../services/inventoryService';
import { getServices } from '../services/serviceService';
import { getEmployees } from '../services/employeeService';
import { saveTransaction } from '../services/transactionService';
import { upsertCustomer } from '../services/customerService';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerHistoryModal from '../components/ui/CustomerHistoryModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatIDR, cleanNumericValue } from '../utils/formatUtils';

const Transactions = () => {
    // Data State
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [employees, setEmployees] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'services'
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [cash, setCash] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [vehicleInfo, setVehicleInfo] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // History Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [pData, sData, eData] = await Promise.all([
                    getProducts(),
                    getServices(),
                    getEmployees()
                ]);
                setProducts(pData);
                setServices(sData);
                setEmployees(eData);
            } catch (error) {
                console.error("Error loading POS data:", error);
            }
        };
        loadData();
    }, []);

    const handleCashChange = (e) => {
        setCash(cleanNumericValue(e.target.value));
    };

    const clearCart = () => {
        setCart([]);
        toast.success("Keranjang dibersihkan");
    };

    const addQuickCash = (amount) => {
        const currentAmount = Number(cash) || 0;
        setCash((currentAmount + amount).toString());
    };

    // Filter Items
    const filteredItems = activeTab === 'products'
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()))
        : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Cart Functions
    const addToCart = (item, type) => {
        const existing = cart.find(c => c.itemId === item.id && c.type === type);

        if (existing) {
            if (type === 'product' && existing.quantity + 1 > item.stock) {
                toast.error("Stok tidak cukup!");
                return;
            }
            setCart(cart.map(c => c.itemId === item.id && c.type === type
                ? { ...c, quantity: c.quantity + 1 }
                : c
            ));
        } else {
            if (type === 'product' && item.stock <= 0) {
                toast.error("Stok Habis!");
                return;
            }
            setCart([...cart, {
                itemId: item.id,
                name: item.name || 'Terhapus/Tanpa Nama',
                price: type === 'product' ? (item.sellPrice || 0) : (item.price || 0),
                buyPrice: type === 'product' ? (item.buyPrice || 0) : 0,
                type,
                quantity: 1,
                mechanicId: type === 'service' ? null : null
            }]);
        }
    };

    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        const item = newCart[index];
        const originalItem = products.find(p => p.id === item.itemId);

        if (item.type === 'product' && originalItem) {
            if (delta > 0 && item.quantity + delta > originalItem.stock) {
                toast.error("Stok mentok!");
                return;
            }
        }

        item.quantity += delta;
        if (item.quantity <= 0) {
            newCart.splice(index, 1);
        }
        setCart(newCart);
    };

    const updateMechanic = (index, mechanicId) => {
        const newCart = [...cart];
        newCart[index].mechanicId = mechanicId;
        setCart(newCart);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    // Calculations
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cashValue = Number(cash) || 0;
    const change = cashValue - totalAmount;

    // Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error("Keranjang kosong!");
        if (cashValue < totalAmount) return toast.error("Uang kurang!");

        // Validate mechanics for services
        const missingMechanic = cart.find(item => item.type === 'service' && !item.mechanicId);
        if (missingMechanic) {
            return toast.error(`Harap pilih mekanik untuk jasa: ${missingMechanic.name}`);
        }

        setIsProcessing(true);
        try {
            const transactionData = {
                items: cart.map(item => {
                    const cleanedItem = {
                        productId: item.itemId,
                        ...item
                    };
                    // Remove strictly undefined fields to make Firestore happy
                    Object.keys(cleanedItem).forEach(key => cleanedItem[key] === undefined && delete cleanedItem[key]);
                    return cleanedItem;
                }),
                totalAmount: totalAmount || 0,
                cash: cashValue || 0,
                change: change || 0,
                customerName: customerName || 'Umum',
                vehicleInfo: vehicleInfo || '-',
                createdAt: new Date(),
            };

            console.log("FINAL TRANSACTION DATA:", transactionData);
            await saveTransaction(transactionData);
            await upsertCustomer(transactionData);

            // Reset
            setCart([]);
            setCash('');
            setCustomerName('');
            setVehicleInfo('');
            toast.success("Transaksi Berhasil!");

            const p = await getProducts();
            setProducts(p);

        } catch (error) {
            toast.error("Gagal memproses transaksi: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-120px)] gap-6 text-slate-200">

            {/* Left Side: Product/Service Catalog */}
            <div className="flex-1 flex flex-col glass-dark rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.05)] border border-[#00f0ff]/10 overflow-hidden relative z-10 min-h-[60vh] lg:min-h-0">

                {/* Header & Tabs */}
                <div className="p-4 border-b border-white/10 space-y-4 bg-black/20">
                    <div className="bg-black/40 p-1.5 rounded-xl flex gap-2 border border-white/5">
                        <button
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'products' ? 'bg-[#00f0ff]/20 text-[#00f0ff] shadow-sm border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setActiveTab('products')}
                        >
                            Sparepart & Barang
                        </button>
                        <button
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'services' ? 'bg-[#b026ff]/20 text-[#b026ff] shadow-sm border border-[#b026ff]/30 shadow-[0_0_10px_rgba(176,38,255,0.2)]' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setActiveTab('services')}
                        >
                            Daftar Jasa Service
                        </button>
                    </div>

                    <div className="relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${activeTab === 'products' ? 'text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]' : 'text-[#b026ff] drop-shadow-[0_0_5px_#b026ff]'}`} size={20} />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab === 'products' ? 'barang' : 'jasa'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl input-primary focus:border-white/20 text-white placeholder-slate-500"
                        />
                    </div>
                </div>

                {/* Item Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filteredItems.length === 0 ? (
                                <div className="col-span-full py-12">
                                    <EmptyState
                                        icon={Search}
                                        title="Tidak ditemukan"
                                        message={`Tidak ada ${activeTab === 'products' ? 'barang' : 'jasa'} dengan nama "${searchTerm}"`}
                                    />
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        key={item.id}
                                        className={`glass-panel border-white/5 p-4 hover-card cursor-pointer flex flex-col justify-between h-full group ${activeTab === 'products' ? 'hover:border-[#00f0ff]/50' : 'hover:border-[#b026ff]/50'}`}
                                        onClick={() => addToCart(item, activeTab === 'products' ? 'product' : 'service')}
                                    >
                                        <div>
                                            <h3 className={`font-bold line-clamp-2 transition-colors ${activeTab === 'products' ? 'group-hover:text-[#00f0ff]' : 'group-hover:text-[#b026ff]'}`}>{item.name}</h3>
                                            <p className="text-slate-400 text-xs mt-1">{item.category}</p>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-between items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                                            <span className={`font-bold tracking-wide ${activeTab === 'products' ? 'text-[#00f0ff] drop-shadow-[0_0_2px_#00f0ff]' : 'text-[#b026ff] drop-shadow-[0_0_2px_#b026ff]'}`}>
                                                Rp {formatIDR(activeTab === 'products' ? item.sellPrice : item.price)}
                                            </span>
                                            {activeTab === 'products' && (
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border whitespace-nowrap ${item.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}>
                                                    Stok: {item.stock}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-full lg:w-[400px] flex flex-col glass-dark rounded-2xl shadow-[0_0_30px_rgba(255,0,127,0.05)] border border-[#ff007f]/20 h-auto lg:h-full relative overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff007f]/5 rounded-bl-[100px] pointer-events-none blur-xl"></div>

                <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
                    <h2 className="font-bold text-white flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                        <ShoppingCart size={20} className="text-[#ff007f]" />
                        Keranjang
                    </h2>
                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10"
                            >
                                Kosongkan
                            </button>
                        )}
                        <span className="text-xs font-bold text-[#ff007f] bg-[#ff007f]/10 px-3 py-1.5 rounded-full border border-[#ff007f]/30">
                            {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[40vh] lg:max-h-none">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-70">
                            <ShoppingCart size={48} className="mb-4 text-slate-600" />
                            <p className="font-medium tracking-wide">Pilih barang/jasa untuk memulai</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {cart.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={`${item.itemId}-${index}`}
                                    className="glass-panel p-4 border border-white/10 relative overflow-hidden group"
                                >
                                    <div className={`absolute left-0 top-0 w-1 h-full ${item.type === 'product' ? 'bg-[#00f0ff]' : 'bg-[#b026ff]'}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="flex-1 pr-2">
                                            <p className="font-bold text-white text-sm line-clamp-1">{item.name}</p>
                                            <p className={`text-xs font-bold mt-0.5 ${item.type === 'product' ? 'text-[#00f0ff]' : 'text-[#b026ff]'}`}>
                                                Rp {formatIDR(item.price)}
                                            </p>
                                        </div>
                                        <button onClick={() => removeFromCart(index)} className="text-slate-500 hover:text-[#ff007f] hover:bg-[#ff007f]/10 p-1.5 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pl-2">
                                        {/* Quantity Control */}
                                        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                                            <button
                                                onClick={() => updateQuantity(index, -1)}
                                                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(index, 1)}
                                                className={`p-1.5 transition-colors text-slate-300 hover:text-white ${item.type === 'product' ? 'hover:bg-[#00f0ff]/20' : 'hover:bg-[#b026ff]/20'}`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <span className="font-bold text-white tracking-wide text-sm">
                                            Rp {formatIDR(item.price * item.quantity)}
                                        </span>
                                    </div>

                                    {/* Mechanic Selection for Services */}
                                    {item.type === 'service' && (
                                        <div className="mt-3 pl-2">
                                            <div className="relative">
                                                <User size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!item.mechanicId ? 'text-red-400' : 'text-[#b026ff]'}`} />
                                                <select
                                                    className={`w-full pl-9 pr-3 py-2 text-xs bg-black/40 rounded-lg focus:outline-none transition-colors border ${!item.mechanicId ? 'border-red-500/50 text-red-100 focus:border-red-400 bg-red-500/5' : 'border-white/10 text-slate-300 focus:border-[#b026ff]/50'}`}
                                                    value={item.mechanicId || ''}
                                                    onChange={(e) => updateMechanic(index, e.target.value)}
                                                >
                                                    <option value="" className="bg-[#050510]">Pilih Mekanik...</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.id} className="bg-[#050510]">{emp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer / Checkout */}
                <div className="p-3 bg-black/40 border-t border-white/5 space-y-2 relative z-10 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 font-medium text-sm">Total Tagihan:</span>
                        <span className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            Rp {formatIDR(totalAmount)}
                        </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Nama Pelanggan (Opsional)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#ff007f]/50 outline-none transition-colors pr-10"
                            />
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00f0ff] transition-colors"
                                title="Lihat Riwayat"
                            >
                                <History size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Info Motor / Nopol (Opsional)"
                            value={vehicleInfo}
                            onChange={(e) => setVehicleInfo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-[#ff007f]/50 outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Bayar: Rp</span>
                            <input
                                type="text"
                                value={formatIDR(cash)}
                                onChange={handleCashChange}
                                className="w-full pl-22 pr-3 py-2.5 bg-white/5 border border-[#ff007f]/30 rounded-xl font-bold text-white text-lg focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f]/50 outline-none shadow-[0_0_15px_rgba(255,0,127,0.1)] transition-all"
                                placeholder="0"
                            />
                        </div>

                        {/* Quick Cash Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {[10000, 20000, 50000, 100000].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => addQuickCash(amt)}
                                    className="px-2 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-all active:scale-95"
                                >
                                    +{amt / 1000}k
                                </button>
                            ))}
                            <button
                                onClick={() => setCash(totalAmount.toString())}
                                className="px-2 py-1 text-[10px] font-bold bg-[#ff007f]/10 hover:bg-[#ff007f]/20 text-[#ff007f] rounded border border-[#ff007f]/30 transition-all active:scale-95"
                            >
                                Pas
                            </button>
                        </div>

                        <div className="flex justify-between items-center text-xs px-1 py-1 bg-black/20 rounded-lg border border-white/5">
                            <span className="text-slate-400">Kembalian:</span>
                            <span className={`font-bold tracking-wide text-sm ${change < 0 ? 'text-red-400' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'}`}>
                                Rp {formatIDR(change)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing || cart.length === 0}
                        className="w-full mt-2 bg-gradient-to-r from-[#ff007f] to-[#b026ff] hover:from-[#ff007f] hover:to-[#9333ea] text-white py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)] transition-all duration-300 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95 border border-white/20 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <span className="relative flex items-center gap-2 z-10">
                            {isProcessing ? 'Memproses...' : (
                                <>
                                    <Printer size={20} />
                                    <span className="tracking-wide">Bayar & Cetak</span>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            <CustomerHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                customerName={customerName}
                licensePlate={vehicleInfo}
            />
        </div>
    );
};

export default Transactions;
