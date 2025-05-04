// components/RoleConfig.js
import React from 'react';
// Importa los iconos necesarios
import { FiEdit } from 'react-icons/fi'; // FiImage como placeholder

export const SidebarConfig = () => {
    return (
        <div className="flex flex-col bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-6 h-[calc(100vh-100px)]"> {/* Contenedor principal */}
            {/* Sección Header */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Configuración del rol</h2>
                <button className="p-1 text-gray-500 hover:text-gray-700" aria-label="Editar configuración">
                    <FiEdit size={18} />
                </button>
            </div>

            {/* Sección Rol */}
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800 block">Rol:</label>
                <p className="text-sm text-gray-600 leading-relaxed">

                </p>
            </div>
        </div>
    );
};
