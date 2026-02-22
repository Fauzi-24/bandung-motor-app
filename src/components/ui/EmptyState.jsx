import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, message, action }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center glass-panel border-dashed border-white/10"
        >
            {Icon && (
                <div className="p-4 bg-white/5 rounded-full mb-4 text-slate-500 opacity-50">
                    <Icon size={48} />
                </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">{title || 'Tidak ada data'}</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-6">{message || 'Silakan tambahkan data baru atau sesuaikan filter pencarian Anda.'}</p>
            {action}
        </motion.div>
    );
};

export default EmptyState;
