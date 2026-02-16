import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, X, Save, Wrench } from 'lucide-react';
import { getServices, addService, updateService, deleteService } from '../services/serviceService';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const formatNumber = (num) => {
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/\./g, '');
        if (value === '' || /^\d+$/.test(value)) {
            setFormData({ ...formData, price: value });
        }
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
    };

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

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus jasa ini?")) {
            try {
                await deleteService(id);
                fetchServices();
                toast.success("Jasa berhasil dihapus!");
            } catch (error) {
                toast.error("Error deleting service: " + error.message);
            }
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Daftar Harga & Jasa</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Jasa
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama jasa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Nama Jasa / Servis</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4 text-right">Ongkos Jasa</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">Belum ada data jasa.</td>
                                </tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                <Wrench size={18} />
                                            </div>
                                            {service.name}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-blue-600 font-bold">
                                            Rp {Number(service.price).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenModal(service)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Hapus"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {currentService ? 'Edit Jasa' : 'Tambah Jasa Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jasa</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Contoh: Servis Ringan, Ganti Ban"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Pilih Kategori</option>
                                    <option value="Servis Mesin">Servis Mesin</option>
                                    <option value="Servis Body">Servis Body</option>
                                    <option value="Kelistrikan">Kelistrikan</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ongkos Jasa</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="text"
                                        required
                                        value={formatNumber(formData.price)}
                                        onChange={handlePriceChange}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Simpan Jasa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
