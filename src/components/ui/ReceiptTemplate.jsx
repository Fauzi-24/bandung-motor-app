import React from 'react';
import { formatIDR } from '../../utils/formatUtils';
import { formatDateIndo } from '../../utils/formatUtils';

// This component is strictly designed for 58mm POS Thermal Printers
export const ReceiptTemplate = React.forwardRef(({ transaction }, ref) => {
    if (!transaction) return null;

    return (
        <div ref={ref} className="hidden print:block w-[58mm] bg-white text-black text-[12px] font-mono leading-tight p-2 mx-auto">
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
                <h2 className="font-bold text-[14px]">BANDUNG MOTOR</h2>
                <p>Jl. Contoh Bengkel No. 123</p>
                <p>Telp: 0812-3456-7890</p>
            </div>

            {/* Transaction Info */}
            <div className="py-2 border-b border-dashed border-black">
                <p>No   : {transaction.id || 'N/A'}</p>
                <p>Tgl  : {formatDateIndo(transaction.createdAt || new Date())}</p>
                <p>Nama : {transaction.customerName || 'Umum'}</p>
                <p>Plat : {transaction.vehicleInfo || '-'}</p>
                <p>Kasir: {transaction.cashierName || 'Kasir'}</p>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-black">
                {transaction.items && transaction.items.map((item, index) => (
                    <div key={index} className="mb-1">
                        <p>{item.name}</p>
                        <div className="flex justify-between">
                            <span>{item.quantity} x {formatIDR(item.price)}</span>
                            <span>{formatIDR(item.quantity * item.price)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-black">
                <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rp {formatIDR(transaction.totalAmount)}</span>
                </div>
                {transaction.cash > 0 && (
                    <>
                        <div className="flex justify-between">
                            <span>Bayar</span>
                            <span>Rp {formatIDR(transaction.cash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kembali</span>
                            <span>Rp {formatIDR(transaction.change)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2">
                <p>Terima Kasih</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
            {/* 
               Adding some white space at the bottom to ensure the printer cuts 
               below the text, not cutting off the footer.
            */}
            <div className="h-8"></div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
