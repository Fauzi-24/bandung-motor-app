import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Trash2, Plus, Minus, User, Save, Printer } from 'lucide-react';
import { getProducts } from '../services/inventoryService';
import { getServices } from '../services/serviceService';
import { getEmployees } from '../services/employeeService';
import { saveTransaction } from '../services/transactionService';

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
    const [lastTransactionId, setLastTransactionId] = useState(null);

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

    const formatNumber = (num) => {
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleCashChange = (e) => {
        const value = e.target.value.replace(/\./g, '');
        if (value === '' || /^\d+$/.test(value)) {
            setCash(value);
        }
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
                name: item.name,
                price: type === 'product' ? item.sellPrice : item.price,
                buyPrice: type === 'product' ? item.buyPrice : 0,
                type,
                quantity: 1,
                mechanicId: null // Only for services
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

        // if (!window.confirm("Proses transaksi ini?")) return;

        setIsProcessing(true);
        try {
            // Structure data for saving
            const transactionData = {
                items: cart.map(item => ({
                    productId: item.itemId, // use productId for both but distinguish with type if needed in future query, but logic uses itemId
                    ...item
                })),
                totalAmount,
                cash: cashValue,
                change,
                change,
                customerName: customerName || 'Umum',
                vehicleInfo: vehicleInfo || '-',
                createdAt: new Date(), // Frontend timestamp backup
                // formatted Items for easier reading if needed, but 'items' has all details
            };

            const id = await saveTransaction(transactionData);
            setLastTransactionId(id);

            // Reset
            setCart([]);
            setCash('');
            setCustomerName('');
            setVehicleInfo('');
            toast.success("Transaksi Berhasil!");

            // Reload products to update stock in UI
            const p = await getProducts();
            setProducts(p);

        } catch (error) {
            toast.error("Gagal memproses transaksi: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6">

            {/* Left Side: Product/Service Catalog */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header & Tabs */}
                <div className="p-4 border-b space-y-4">
                    <div className="bg-gray-100 p-1.5 rounded-xl flex gap-2">
                        <button
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'products' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('products')}
                        >
                            Barang
                        </button>
                        <button
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'services' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('services')}
                        >
                            Jasa
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab === 'products' ? 'barang' : 'jasa'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl input-primary bg-gray-50/50"
                        />
                    </div>
                </div>

                {/* Item Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="border border-gray-100 rounded-xl p-4 hover-card cursor-pointer flex flex-col justify-between h-full bg-white group"
                                onClick={() => addToCart(item, activeTab === 'products' ? 'product' : 'service')}
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 line-clamp-2">{item.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{item.category}</p>
                                </div>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="font-bold text-blue-600">
                                        Rp {Number(activeTab === 'products' ? item.sellPrice : item.price).toLocaleString('id-ID')}
                                    </span>
                                    {activeTab === 'products' && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Stok: {item.stock}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 h-full">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={20} />
                        Keranjang
                    </h2>
                    <span className="text-sm font-medium text-gray-500">{cart.reduce((s, i) => s + i.quantity, 0)} Item</span>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart size={48} className="mb-2 opacity-50" />
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                                        <p className="text-sm text-blue-600 font-medium">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    {/* Quantity Control */}
                                    <div className="flex items-center border rounded-lg bg-gray-50">
                                        <button
                                            onClick={() => updateQuantity(index, -1)}
                                            className="p-1 hover:bg-gray-200 rounded-l-lg transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(index, 1)}
                                            className="p-1 hover:bg-gray-200 rounded-r-lg transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {/* Subtotal */}
                                    <span className="font-bold text-gray-800">
                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Mechanic Selection for Services */}
                                {item.type === 'service' && (
                                    <div className="mt-2">
                                        <div className="relative">
                                            <User size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select
                                                className={`w-full pl-7 pr-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none ${!item.mechanicId ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                value={item.mechanicId || ''}
                                                onChange={(e) => updateMechanic(index, e.target.value)}
                                            >
                                                <option value="">Pilih Mekanik...</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 bg-gray-50 border-t space-y-4">
                    <div className="flex justify-between items-center text-gray-600">
                        <span>Total Tagihan:</span>
                        <span className="text-xl font-bold text-gray-900">
                            Rp {totalAmount.toLocaleString('id-ID')}
                        </span>
                    </div>

                    {/* Customer Info Inputs */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <input
                            type="text"
                            placeholder="Nama Pelanggan (Opsional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm input-primary bg-gray-50/30"
                        />
                        <input
                            type="text"
                            placeholder="Info Motor / Nopol (Opsional)"
                            value={vehicleInfo}
                            onChange={(e) => setVehicleInfo(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm input-primary bg-gray-50/30"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Bayar: Rp</span>
                            <input
                                type="text"
                                value={formatNumber(cash)}
                                onChange={handleCashChange}
                                className="w-full pl-24 pr-4 py-3 border border-gray-200 rounded-xl input-primary font-bold text-gray-800 text-lg shadow-sm"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex justify-between items-center text-sm px-1">
                            <span className="text-gray-500">Kembalian:</span>
                            <span className={`font-bold ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Rp {change.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing || cart.length === 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isProcessing ? 'Memproses...' : (
                            <>
                                <Printer size={20} />
                                Bayar & Cetak
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
