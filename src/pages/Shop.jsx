import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Search, Plus, Minus, Trash2, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../services/inventoryService';
import { placeOrder } from '../services/onlineOrderService';
import { motion, AnimatePresence } from 'framer-motion';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [customerForm, setCustomerForm] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await getProducts();
                // Only show products with stock > 0
                setProducts(data.filter(item => item.stock > 0));
            } catch (error) {
                console.error("Error fetching products:", error);
                toast.error("Gagal memuat daftar barang");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const filteredProducts = (products || []).filter(p =>
        (p?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (p?.category && p.category.toLowerCase().includes((searchQuery || '').toLowerCase()))
    );

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                toast.error("Stok tidak mencukupi!");
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1, type: 'product', productId: product.id }]);
        }
        toast.success(`${product.name} ditambahkan`);
    };

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(id);
            return;
        }

        const product = products.find(p => p.id === id);
        if (product && newQuantity > product.stock) {
            toast.error("Melebihi stok yang tersedia");
            return;
        }

        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        if (!customerForm.name || !customerForm.phone) {
            toast.error("Mohon lengkapi nama dan nomor HP");
            return;
        }

        try {
            const orderData = {
                customerName: customerForm.name,
                customerPhone: customerForm.phone,
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    type: 'product',
                    buyPrice: item.buyPrice || 0
                })),
                totalAmount: cartTotal
            };

            const newOrderId = await placeOrder(orderData);
            setOrderId(newOrderId);

            // Clear cart & form
            setCart([]);
            setCustomerForm({ name: '', phone: '' });
            setIsCheckoutModalOpen(false);
            setIsCartOpen(false);
            setIsSuccessModalOpen(true);

        } catch (error) {
            toast.error("Gagal membuat pesanan");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#050510] text-slate-200 flex flex-col items-center">

            {/* Header */}
            <header className="w-full max-w-6xl p-6 flex justify-between items-center z-10 sticky top-0 bg-[#050510]/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#b026ff]/20 rounded-xl flex items-center justify-center border border-[#b026ff]/50 shadow-[0_0_15px_rgba(176,38,255,0.3)]">
                        <ShoppingBag className="text-[#00f0ff]" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">BANDUNG<span className="text-[#00f0ff]">MOTOR</span></h1>
                        <p className="text-[10px] text-[#b026ff] font-bold uppercase tracking-wider">Online Parts Store</p>
                    </div>
                </div>

                <div
                    className="relative cursor-pointer group"
                    onClick={() => setIsCartOpen(true)}
                >
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                        <ShoppingCart size={24} className="text-slate-300 group-hover:text-white" />
                    </div>
                    {cartItemsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#ff007f] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(255,0,127,0.5)] border-2 border-[#050510]">
                            {cartItemsCount}
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-6xl p-6 flex-1 relative z-0">

                {/* Search & Intro */}
                <div className="mb-10 text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        Pesan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#b026ff]">Suku Cadang</span> Asli
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto">Pesan sekarang dari rumah, bayar & ambil langsung di bengkel. Cepat, aman, tanpa antre panjang.</p>

                    <div className="max-w-md mx-auto relative mt-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari oli, busi, kampas rem..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/50 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        />
                    </div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#00f0ff] animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-[#00f0ff]/30 transition-all group hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00f0ff]/10 to-transparent rounded-bl-full -mr-4 -mt-4"></div>

                                <div className="p-3 bg-black/40 w-12 h-12 rounded-xl mb-4 flex items-center justify-center border border-white/10 group-hover:border-[#00f0ff]/50 transition-colors">
                                    <Package size={24} className="text-slate-400 group-hover:text-[#00f0ff]" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-white mb-1 line-clamp-2">{product.name}</h3>
                                    <p className="text-xs text-[#00f0ff] font-medium px-2 py-0.5 bg-[#00f0ff]/10 rounded inline-block mb-3 border border-[#00f0ff]/20">
                                        {product.category || 'General'}
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5">Harga</p>
                                        <p className="font-bold text-white tracking-wide">Rp {product.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="p-2.5 bg-[#b026ff]/10 text-[#b026ff] hover:bg-[#b026ff] hover:text-white rounded-xl border border-[#b026ff]/30 transition-all shadow-[0_0_10px_rgba(176,38,255,0.2)] hover:shadow-[0_0_15px_rgba(176,38,255,0.5)]"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {filteredProducts.length === 0 && !isLoading && (
                    <div className="text-center py-20 text-slate-500">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Barang tidak ditemukan.</p>
                    </div>
                )}

            </main>

            {/* Cart Sidebar drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsCartOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShoppingCart className="text-[#00f0ff]" /> Keranjang ({cartItemsCount})
                                </h2>
                                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-lg">
                                    <span className="sr-only">Tutup</span>
                                    &times;
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                        <ShoppingCart size={48} className="opacity-20" />
                                        <p>Keranjang masih kosong</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="bg-black/30 p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white truncate">{item.name}</h4>
                                                <p className="text-[#00f0ff] font-medium mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1 border border-white/5">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-bold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="p-6 border-t border-white/10 bg-black/40">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-slate-400 font-medium">Total Estimasi</span>
                                        <span className="text-2xl font-bold text-white">Rp {cartTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <button
                                        onClick={() => setIsCheckoutModalOpen(true)}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-[#00f0ff] to-[#0284c7] hover:to-[#0369a1] text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
                                    >
                                        Lanjut Pesan <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isCheckoutModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-[#b026ff]/20 to-transparent p-6 border-b border-white/10">
                                <h3 className="text-2xl font-bold text-white tracking-tight">Data Pengambil</h3>
                                <p className="text-slate-400 mt-1 text-sm">Isi data agar kami mudah menyiapkan pesanan Anda</p>
                            </div>

                            <form onSubmit={handleCheckout} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={customerForm.name}
                                        onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all outline-none"
                                        placeholder="Cth: Budi Santoso"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">No. Handphone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        required
                                        value={customerForm.phone}
                                        onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all outline-none"
                                        placeholder="Cth: 08123456789"
                                    />
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCheckoutModalOpen(false)}
                                        className="flex-1 px-4 py-3 border border-white/10 text-slate-300 hover:bg-white/5 rounded-2xl transition-all font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-4 py-3 bg-gradient-to-r from-[#b026ff] to-[#7c1cf5] hover:to-[#5c13bd] text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(176,38,255,0.4)]"
                                    >
                                        Kirim Pesanan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-[#00f0ff]/30 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.15)] w-full max-w-sm overflow-hidden text-center p-8 relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/20 blur-[50px] rounded-full -mr-10 -mt-10"></div>

                            <div className="w-20 h-20 bg-[#00f0ff]/10 text-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#00f0ff]/50 relative z-10 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                >
                                    <CheckCircle2 size={40} />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 relative z-10 tracking-tight">Pesanan Berhasil!</h2>
                            <p className="text-slate-400 mb-6 relative z-10 text-sm">
                                Tunjukkan bukti pesanan ini ke kasir saat Anda tiba di bengkel untuk mengambil & membayar.
                            </p>

                            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-8 relative z-10 text-left">
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">ID Pesanan (Simpan!)</p>
                                <p className="font-mono text-xl text-[#b026ff] font-bold tracking-wider">{orderId ? `${orderId.substring(0, 6).toUpperCase()}` : '...'}</p>
                            </div>

                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all relative z-10 border border-white/10"
                            >
                                Kembali ke Toko
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Shop;
