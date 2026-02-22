import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Save, User, Calendar, DollarSign, Activity } from 'lucide-react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, resetEmployeePassword } from '../services/employeeService';
import { getEmployeePerformance } from '../services/transactionService';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { formatIDR } from '../utils/formatUtils';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const firstInputRef = useRef(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    // CRUD Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'Mekanik',
        phone: '',
        email: '',
        password: '',
        gajiPokok: '',
        uangMakan: '',
        komisiPersen: 40
    });

    // Payroll Modal
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [payrollData, setPayrollData] = useState(null);
    const [payrollStartDate, setPayrollStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [payrollEndDate, setPayrollEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [kehadiran, setKehadiran] = useState(0);
    const [potongan, setPotongan] = useState(0);

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
                phone: employee.phone || '',
                email: employee.email || '',
                password: '', // Don't show password on edit
                gajiPokok: employee.gajiPokok || '',
                uangMakan: employee.uangMakan || '',
                komisiPersen: employee.komisiPersen !== undefined ? employee.komisiPersen : 40
            });
        } else {
            setCurrentEmployee(null);
            setFormData({
                name: '',
                role: 'Mekanik',
                phone: '',
                email: '',
                password: '',
                gajiPokok: '',
                uangMakan: '',
                komisiPersen: 40
            });
        }
        setIsModalOpen(true);
        setTimeout(() => firstInputRef.current?.focus(), 100);
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                handleCloseModal();
                setIsPayrollModalOpen(false);
            }
        };
        if (isModalOpen || isPayrollModalOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen, isPayrollModalOpen]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEmployee(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filter out password for update, only needed for creation
            const { password, ...updateData } = formData;
            if (currentEmployee) {
                await updateEmployee(currentEmployee.id, updateData);
            } else {
                await addEmployee(updateData, formData.password);
            }
            fetchEmployees();
            handleCloseModal();
            toast.success("Karyawan berhasil disimpan!");
        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error(`Gagal menyimpan karyawan: ${error.message}`);
        }
    };

    const confirmDelete = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await deleteEmployee(deleteConfirm.id);
            fetchEmployees();
            toast.success("Karyawan berhasil dihapus!");
        } catch (error) {
            toast.error("Error deleting employee: " + error.message);
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const handleResetPassword = async (email) => {
        try {
            await resetEmployeePassword(email);
            toast.success("Link reset password telah dikirim ke email!");
        } catch (error) {
            toast.error("Gagal mengirim link reset password: " + error.message);
        }
    };

    // Payroll Functions
    const handleOpenPayroll = async (employee) => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedEmployeeId(employee.id);
        setCurrentEmployee(employee);
        setPayrollStartDate(today);
        setPayrollEndDate(today);
        setKehadiran(0);
        setPotongan(0);
        setPayrollData(null);
        setIsPayrollModalOpen(true);
        await calculatePayroll(employee.id, today, today);
    };

    const calculatePayroll = async (empId, startDate, endDate) => {
        try {
            const result = await getEmployeePerformance(empId, startDate, endDate);
            setPayrollData(result);
        } catch (error) {
            console.error("Error calculating payroll:", error);
        }
    };

    const handleSetThisWeek = async () => {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay() + 1; // Monday
        const last = first + 6; // Sunday

        const startDate = new Date(curr.setDate(first)).toISOString().split('T')[0];
        const endDate = new Date(curr.setDate(last)).toISOString().split('T')[0];

        setPayrollStartDate(startDate);
        setPayrollEndDate(endDate);
        if (selectedEmployeeId) {
            await calculatePayroll(selectedEmployeeId, startDate, endDate);
        }
    };

    const handleSetThisMonth = async () => {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

        setPayrollStartDate(firstDay);
        setPayrollEndDate(lastDay);
        if (selectedEmployeeId) {
            await calculatePayroll(selectedEmployeeId, firstDay, lastDay);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        show: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <div className="space-y-6 text-slate-200">
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Manajemen Karyawan</h1>
                    <p className="text-[#bae6fd] mt-1 font-medium">Kelola data dan gaji mekanik & staf</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#050510] px-4 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] border border-[#00f0ff]/50 font-bold"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Tambah Karyawan</span>
                </button>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {loading ? (
                    <div className="col-span-full py-12">
                        <LoadingSpinner label="Memuat data karyawan..." />
                    </div>
                ) : employees.length === 0 ? (
                    <div className="col-span-full py-12">
                        <EmptyState
                            icon={User}
                            title="Belum ada karyawan"
                            message="Daftar karyawan dan mekanik Anda masih kosong. Silakan tambah data baru untuk mengelola kinerja mereka."
                        />
                    </div>
                ) : (
                    employees.map((employee) => (
                        <motion.div variants={cardVariants} key={employee.id} className="glass-panel p-6 border-white/10 hover-card relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-2xl opacity-10 rounded-full ${employee.role === 'Mekanik' ? 'bg-[#ff007f]' : employee.role === 'Admin' ? 'bg-[#00f0ff]' : 'bg-[#b026ff]'}`}></div>

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] ${employee.role === 'Mekanik' ? 'bg-[#ff007f]/10 text-[#ff007f]' : employee.role === 'Admin' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' : 'bg-[#b026ff]/10 text-[#b026ff]'}`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg drop-shadow-sm">{employee.name}</h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border tracking-wider ${employee.role === 'Mekanik' ? 'bg-[#ff007f]/10 text-[#ff007f] border-[#ff007f]/30' :
                                            employee.role === 'Admin' ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30' :
                                                'bg-[#b026ff]/10 text-[#b026ff] border-[#b026ff]/30'
                                            }`}>
                                            {employee.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(employee)}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/20"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(employee.id)}
                                        className="p-1.5 text-slate-400 hover:text-[#ff007f] hover:bg-[#ff007f]/10 rounded-lg transition-colors border border-transparent hover:border-[#ff007f]/30"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="text-sm bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">No. HP:</span>
                                    <span className="font-medium text-white font-mono">{employee.phone || '-'}</span>
                                </div>

                                <button
                                    onClick={() => handleOpenPayroll(employee)}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all border shadow-lg ${employee.role === 'Mekanik'
                                        ? 'bg-gradient-to-r from-[#ff007f]/20 to-transparent border-[#ff007f]/30 text-[#ff007f] hover:bg-[#ff007f] hover:text-white hover:shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Activity size={18} />
                                    {employee.role === 'Mekanik' ? 'Gaji & Kinerja' : 'Detail'}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* CRUD Modal */}
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
                            className="glass-dark rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] border border-white/10 w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] via-[#b026ff] to-[#ff007f]"></div>

                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
                                <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                    {currentEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors p-1">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        ref={firstInputRef}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Email <span className="text-xs text-slate-500">(Untuk Login)</span></label>
                                    <input
                                        type="email"
                                        required={!currentEmployee}
                                        disabled={!!currentEmployee}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20 disabled:opacity-50"
                                        placeholder="email@bengkel.com"
                                    />
                                </div>
                                {!currentEmployee && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Password Awal</label>
                                        <input
                                            type="text"
                                            required={!currentEmployee}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Jabatan / Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20 [&>option]:bg-[#050510] [&>option]:text-white"
                                    >
                                        <option value="Mekanik">Mekanik</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Kasir">Kasir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Nomor HP</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                        placeholder="0812xxxxxx"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Gaji Pokok</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-2.5 text-slate-400">Rp</span>
                                            <input
                                                type="number"
                                                value={formData.gajiPokok}
                                                onChange={e => setFormData({ ...formData, gajiPokok: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Uang Makan / Hari</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-2.5 text-slate-400">Rp</span>
                                            <input
                                                type="number"
                                                value={formData.uangMakan}
                                                onChange={e => setFormData({ ...formData, uangMakan: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {formData.role === 'Mekanik' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Persentase Komisi (%)</label>
                                        <input
                                            type="number"
                                            value={formData.komisiPersen}
                                            onChange={e => setFormData({ ...formData, komisiPersen: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                            placeholder="40"
                                        />
                                        <p className="text-xs text-slate-500 mt-1 ml-1">Default: 40% dari harga setiap jasa perbaikan.</p>
                                    </div>
                                )}

                                {currentEmployee && currentEmployee.email && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-xs text-slate-500 mb-3">Karyawan lupa password? Kirim link reset ke email mereka.</p>
                                        <button
                                            type="button"
                                            onClick={() => handleResetPassword(currentEmployee.email)}
                                            className="w-full py-2 text-xs font-bold text-[#b026ff] border border-[#b026ff]/30 rounded-lg hover:bg-[#b026ff]/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={14} /> {/* Using Save as a fallback icon for reset/send */}
                                            Kirim Email Reset Password
                                        </button>
                                    </div>
                                )}
                                <div className="mt-8 pt-4 border-t border-white/10 flex gap-3">
                                    <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border border-white/20 text-slate-300 hover:bg-white/5 rounded-xl transition-all">Batal</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-[#00f0ff] hover:bg-[#0ea5e9] text-[#050510] font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]">Simpan</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payroll Modal */}
            <AnimatePresence>
                {isPayrollModalOpen && currentEmployee && (
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
                            className="glass-dark rounded-2xl shadow-[0_0_40px_rgba(255,0,127,0.15)] border border-white/10 w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff007f] to-[#b026ff]"></div>

                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Laporan Kinerja</h2>
                                    <p className="text-sm font-medium text-[#ff007f] tracking-wide">{currentEmployee.name}</p>
                                </div>
                                <button onClick={() => setIsPayrollModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Date Range Picker */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                                        <Calendar size={20} className="text-[#00f0ff] min-w-5 shrink-0" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-xs w-10">Mulai:</span>
                                                <input
                                                    type="date"
                                                    value={payrollStartDate}
                                                    onChange={(e) => {
                                                        setPayrollStartDate(e.target.value);
                                                        calculatePayroll(selectedEmployeeId, e.target.value, payrollEndDate);
                                                    }}
                                                    className="bg-transparent border border-white/10 rounded-md px-2 py-1 outline-none w-full text-white text-sm focus:border-[#00f0ff]/50 [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-xs w-10">Sampai:</span>
                                                <input
                                                    type="date"
                                                    value={payrollEndDate}
                                                    onChange={(e) => {
                                                        setPayrollEndDate(e.target.value);
                                                        calculatePayroll(selectedEmployeeId, payrollStartDate, e.target.value);
                                                    }}
                                                    className="bg-transparent border border-white/10 rounded-md px-2 py-1 outline-none w-full text-white text-sm focus:border-[#00f0ff]/50 [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSetThisWeek}
                                            className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-lg hover:bg-[#00f0ff]/20 transition-colors"
                                        >
                                            Minggu Ini
                                        </button>
                                        <button
                                            onClick={handleSetThisMonth}
                                            className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#b026ff] bg-[#b026ff]/10 border border-[#b026ff]/20 rounded-lg hover:bg-[#b026ff]/20 transition-colors"
                                        >
                                            Bulan Ini
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-panel p-4 border border-[#00f0ff]/20 rounded-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[#00f0ff]/5 group-hover:bg-[#00f0ff]/10 transition-colors"></div>
                                        <p className="text-xs text-[#00f0ff] mb-1 font-bold tracking-wider uppercase">Total Servis</p>
                                        <p className="text-3xl font-bold text-white drop-shadow-[0_0_5px_rgba(0,240,255,0.4)] relative z-10">
                                            {payrollData ? payrollData.totalServices : '...'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 relative z-10">Unit / Pelanggan</p>
                                    </div>
                                    <div className="glass-panel p-4 border border-emerald-500/20 rounded-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                                        <p className="text-xs text-emerald-400 mb-1 font-bold tracking-wider uppercase">Omset Jasa</p>
                                        <p className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(52,211,153,0.4)] relative z-10 mt-1">
                                            Rp {payrollData ? formatIDR(payrollData.totalRevenueGenerated) : '...'}
                                        </p>
                                    </div>
                                </div>

                                {/* Wage Calculation */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Kehadiran (Hari)</label>
                                            <input
                                                type="number"
                                                value={kehadiran}
                                                onChange={e => setKehadiran(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1 ml-1">Potongan / Bon (Rp)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-2.5 text-slate-400">Rp</span>
                                                <input
                                                    type="number"
                                                    value={potongan}
                                                    onChange={e => setPotongan(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl input-primary focus:border-[#ff007f]/50 focus:ring-[#ff007f]/20"
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-4 mt-2 bg-gradient-to-b from-transparent to-white/5 rounded-b-xl -mx-6 -mb-6 p-6 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">Gaji Pokok</span>
                                            <span className="font-medium text-white">Rp {formatIDR(currentEmployee.gajiPokok || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">Uang Makan ({kehadiran || 0} Hari)</span>
                                            <span className="font-medium text-white">Rp {formatIDR((currentEmployee.uangMakan || 0) * (kehadiran || 0))}</span>
                                        </div>
                                        {currentEmployee.role === 'Mekanik' && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Komisi ({currentEmployee.komisiPersen !== undefined ? currentEmployee.komisiPersen : 40}%)</span>
                                                <span className="font-medium text-[#00f0ff]">Rp {formatIDR(payrollData ? (payrollData.totalRevenueGenerated * ((currentEmployee.komisiPersen !== undefined ? currentEmployee.komisiPersen : 40) / 100)) : 0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm text-[#ff007f]">
                                            <span>Potongan / Kasbon</span>
                                            <span className="font-medium">- Rp {formatIDR(potongan || 0)}</span>
                                        </div>

                                        <div className="pt-3 border-t border-white/10 flex justify-between items-center mb-2">
                                            <span className="text-slate-300 font-bold">Total Gaji Bersih</span>
                                            <span className="font-bold text-emerald-400 text-3xl drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                                Rp {formatIDR(
                                                    Number(currentEmployee.gajiPokok || 0) +
                                                    (Number(currentEmployee.uangMakan || 0) * Number(kehadiran || 0)) +
                                                    (currentEmployee.role === 'Mekanik' && payrollData ? (payrollData.totalRevenueGenerated * ((currentEmployee.komisiPersen !== undefined ? currentEmployee.komisiPersen : 40) / 100)) : 0) -
                                                    Number(potongan || 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Hapus Karyawan"
                message="Apakah Anda yakin ingin menghapus karyawan ini? Seluruh data akses mereka akan dicabut dan tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
};

export default Employees;
