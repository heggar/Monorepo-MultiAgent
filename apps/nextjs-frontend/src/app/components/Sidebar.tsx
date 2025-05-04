'use client'

import { IoLogoReact } from 'react-icons/io5';
import { GoGoal } from "react-icons/go";
import { MdOutlineSupportAgent } from "react-icons/md";
import { HiDocumentMagnifyingGlass } from "react-icons/hi2";
import { TbReportAnalytics } from "react-icons/tb";

import Image from 'next/image';
import { SidebarMenuItem } from './SidebarMenuItem';
import { useParams } from 'next/navigation';
import { WebSocketInitializer } from '@/app/components/WebSocketInitializer';


const menuItems = [
    {
        getPath: (uuid: string) => `/dashboard/${uuid}/alcance`,
        icon: <GoGoal size={30} />,
        title: 'Alcance',
        subTitle: 'Alcance de los agentes',
    },
    {
        getPath: (uuid: string) => `/dashboard/${uuid}/agentes`,
        icon: <MdOutlineSupportAgent size={30} />,
        title: 'Agentes',
        subTitle: 'Hable con tus agentes',
    },

    {
        getPath: (uuid: string) => `/dashboard/${uuid}/documentos`,
        icon: <HiDocumentMagnifyingGlass size={30} />,
        title: 'Documentos',
        subTitle: 'Hable con tus documentos',
    },

    {
        getPath: (uuid: string) => `/dashboard/${uuid}/resultados`,
        icon: <TbReportAnalytics size={30} />,
        title: 'Resultados',
        subTitle: 'Resultados de los agentes',
    },
]

export const Sidebar = () => {
    const { uuid } = useParams() as { uuid: string };

    return (

        <div id="menu"
            style={{ width: '400px' }}
            className="bg-gray-900 min-h-screen z-10 text-slate-300 w-64 left-0 h-screen overflow-y-scroll">
            
            <WebSocketInitializer uuid={uuid} />

            <div id="logo" className="my-4 px-6">
                <h1 className="flex items-center  text-lg md:text-2xl font-bold text-white">
                    <IoLogoReact className='mr-2' />
                    <span> Sistema Multiagente</span>
                    <span className="text-blue-500"></span>.
                </h1>
                <p className="text-slate-500 text-sm">Asistente</p>
            </div>

            <div id="nav" className="w-full px-6">

                {
                    menuItems.map(item => (
                        <SidebarMenuItem key={item.getPath(uuid)} {...item} path={item.getPath(uuid)} />
                    ))
                }

            </div>
        </div>
    )

}