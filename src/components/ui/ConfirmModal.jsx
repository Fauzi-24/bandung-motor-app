import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Hapus', cancelText = 'Batal' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-dark rounded-2xl shadow-[0_0_40px_rgba(255,0,127,0.15)] border border-white/10 w-full max-w-sm overflow-hidden relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-[#ff007f]"></div>

                        <div className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                    <AlertTriangle size={36} />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white text-center mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                {title}
                            </h2>
                            <p className="text-slate-400 text-center mb-8">
                                {message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 border border-white/20 text-slate-300 hover:bg-white/5 rounded-xl transition-all"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-[#ff007f] hover:from-rose-400 hover:to-rose-600 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,0,127,0.4)] hover:shadow-[0_0_25px_rgba(255,0,127,0.6)]"
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
