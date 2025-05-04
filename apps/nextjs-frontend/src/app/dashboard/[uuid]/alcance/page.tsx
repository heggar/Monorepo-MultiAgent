
import { ChatPanel } from "@/app/components";
import { FiShare2, FiMenu } from "react-icons/fi"; // Iconos de compartir y menú
import { SiElectronbuilder } from "react-icons/si"; // Icono de Electron Builder
import { SidebarConfig } from "./SidebarConfig"; // Importa el componente SidebarConfig

export default function AgentesPage() {
    return (
        <div className="flex flex-col justify-center"  >
            <header className="flex items-center justify-between w-full p-4 bg-white border-b border-gray-200 rounded-2xl">
                {/* Sección Izquierda */}
                <div className="flex items-center space-x-3">
                    {/* Icono Principal */}
                    <SiElectronbuilder className="text-purple-600 text-2xl" />

                    {/* Título */}
                    <h1 className="text-sm font-medium text-gray-800">
                        Asistencia para determinar el alcance de la investigación
                    </h1>
                </div>

                {/* Sección Derecha */}
                <div className="flex items-center space-x-4">
                    <button aria-label="Compartir" className="text-gray-500 hover:text-gray-700">
                        <FiShare2 className="text-xl" />
                    </button>
                    <button aria-label="Menú" className="text-gray-500 hover:text-gray-700">
                        <FiMenu className="text-2xl" />
                    </button>
                </div>
            </header>
            <main className="flex flex-row items-center justify-center w-full h-full p-1">
                <div className="basis-4/5">            <ChatPanel/> </div>
                <div className="basis-1/5"><SidebarConfig/>    </div>
                
            </main>
        </div>
    );
}