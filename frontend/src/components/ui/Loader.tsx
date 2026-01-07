import React from "react";

export const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-xl dark:bg-slate-800">
                <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500"></div>
                    <img
                        src="https://singaji.in/assest/SSS-Favicon-Design.png"
                        alt="Loading"
                        className="absolute w-12 h-12 animate-pulse object-contain"
                    />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                    Loading...
                </p>
            </div>
        </div>
    );
};
