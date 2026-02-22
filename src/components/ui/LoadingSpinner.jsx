import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#00f0ff', label }) => {
    const sizeClasses = {
        small: 'h-4 w-4 border-2',
        medium: 'h-8 w-8 border-2',
        large: 'h-12 w-12 border-3'
    };

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div
                className={`animate-spin rounded-full border-b-transparent border-t-transparent ${sizeClasses[size]}`}
                style={{
                    borderColor: `${color}44`,
                    borderTopColor: color,
                    borderBottomColor: color,
                    boxShadow: `0 0 15px ${color}44`
                }}
            ></div>
            {label && <p className="mt-4 text-slate-400 tracking-wide font-medium text-sm">{label}</p>}
        </div>
    );
};

export default LoadingSpinner;
