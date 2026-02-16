import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Save, User, Calendar, DollarSign } from 'lucide-react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../services/employeeService';
import { getEmployeePerformance } from '../services/transactionService';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'Mekanik',
        phone: ''
    });

    // Payroll Modal
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [payrollData, setPayrollData] = useState(null);
    const [payrollDate, setPayrollDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // CRUD Functions
    const handleOpenModal = (employee = null) => {
        if (employee) {
            setCurrentEmployee(employee);
            setFormData({
                name: employee.name,
                role: employee.role,
                phone: employee.phone || ''
            });
        } else {
            setCurrentEmployee(null);
            setFormData({
                name: '',
                role: 'Mekanik',
                phone: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEmployee(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentEmployee) {
                await updateEmployee(currentEmployee.id, formData);
            } else {
                await addEmployee(formData);
            }
            fetchEmployees();
            handleCloseModal();
            toast.success("Karyawan berhasil disimpan!");
        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error(`Gagal menyimpan karyawan: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus karyawan ini?")) {
            try {
                await deleteEmployee(id);
                fetchEmployees();
                toast.success("Karyawan berhasil dihapus!");
            } catch (error) {
                toast.error("Error deleting employee: " + error.message);
            }
        }
    };

    // Payroll Functions
    const handleOpenPayroll = async (employee) => {
        setSelectedEmployeeId(employee.id);
        setCurrentEmployee(employee);
        setPayrollData(null);
        setIsPayrollModalOpen(true);
        // Fetch default for today
        await calculatePayroll(employee.id, payrollDate);
    };

    const calculatePayroll = async (empId, date) => {
        try {
            const result = await getEmployeePerformance(empId, date, date);
            setPayrollData(result);
        } catch (error) {
            console.error("Error calculating payroll:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Karyawan</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Tambah Karyawan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500">Memuat data karyawan...</p>
                ) : employees.length === 0 ? (
                    <p className="text-gray-500">Belum ada karyawan.</p>
                ) : (
                    employees.map((employee) => (
                        <div key={employee.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-full text-gray-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{employee.name}</h3>
                                        <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{employee.role}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(employee)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(employee.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Hapus"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p className="flex justify-between">
                                        <span>No. HP:</span>
                                        <span className="font-medium">{employee.phone || '-'}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleOpenPayroll(employee)}
                                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium border border-green-200"
                                >
                                    <DollarSign size={18} />
                                    Lihat Gaji / Kinerja
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {currentEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan / Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Mekanik">Mekanik</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Kasir">Kasir</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payroll Modal */}
            {isPayrollModalOpen && currentEmployee && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Laporan Kinerja</h2>
                                <p className="text-sm text-gray-500">{currentEmployee.name}</p>
                            </div>
                            <button onClick={() => setIsPayrollModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Date Picker */}
                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                                <Calendar size={20} className="text-gray-500" />
                                <input
                                    type="date"
                                    value={payrollDate}
                                    onChange={(e) => {
                                        setPayrollDate(e.target.value);
                                        calculatePayroll(selectedEmployeeId, e.target.value);
                                    }}
                                    className="bg-transparent outline-none w-full text-gray-700 font-medium"
                                />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 mb-1 font-medium">Total Servis</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {payrollData ? payrollData.totalServices : '...'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Pelanggan</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-xs text-green-600 mb-1 font-medium">Omset Jasa</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        Rp {payrollData ? payrollData.totalRevenueGenerated.toLocaleString('id-ID') : '...'}
                                    </p>
                                </div>
                            </div>

                            {/* Wage Calculation */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Estimasi Komisi (40%)</span>
                                    <span className="font-bold text-green-600 text-xl">
                                        Rp {payrollData ? payrollData.estimatedWage.toLocaleString('id-ID') : '0'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    *Perhitungan otomatis berdasarkan jumlah jasa yang ditangani pada tanggal {payrollDate}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
