import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Login gagal. Periksa email dan password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-200">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#b026ff]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md p-1 relative z-10"
            >
                {/* Hyprland Animated Border Wrapper */}
                <div className="animated-border rounded-3xl absolute inset-0 pointer-events-none opacity-80"></div>

                <div className="animated-border-content glass-dark border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00f0ff] to-[#b026ff] rounded-2xl mb-6 shadow-[0_0_30px_rgba(176,38,255,0.4)] flex items-center justify-center border border-white/20 p-1"
                        >
                            <div className="w-full h-full bg-[#050510] rounded-xl flex items-center justify-center">
                                <span className="text-3xl font-black bg-gradient-to-r from-[#00f0ff] to-[#b026ff] bg-clip-text text-transparent">BM</span>
                            </div>
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            Bandung Motor
                        </h2>
                        <p className="text-[#bae6fd] mt-2 font-medium">Sistem Manajemen Bengkel</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_#f87171] flex-shrink-0"></div>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 uppercase tracking-wider text-[10px]">Email Kredensial</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl input-primary focus:border-[#00f0ff]/50 focus:ring-[#00f0ff]/20 bg-black/40 text-lg transition-all"
                                placeholder="nama@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 uppercase tracking-wider text-[10px]">Kata Sandi</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl input-primary focus:border-[#b026ff]/50 focus:ring-[#b026ff]/20 bg-black/40 text-lg transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-8 bg-gradient-to-r from-[#00f0ff] to-[#b026ff] hover:from-[#00c8ff] hover:to-[#9a1ce6] text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 flex justify-center items-center border border-white/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Otorisasi Masuk"
                            )}
                        </motion.button>

                        <div className="text-center mt-6">
                            <p className="text-xs text-slate-500 font-medium">
                                Dilindungi oleh <span className="text-[#00f0ff]">Autentikasi Aman</span>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
