/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from '@google/genai';
import * as XLSX from 'xlsx';
import { Mic, MicOff, Layout, Plus, LogOut, Settings, Bell, X } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import Visualizer from './components/Visualizer';
import TaskModal from './components/TaskModal';

import AppointmentsModal from './components/AppointmentsModal';

import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { Task, TaskStatus, AppSettings, StatusLabels } from './types';
import { createPcmBlob, base64ToArrayBuffer, pcmToAudioBuffer } from './utils/audioUtils';
import { auth, db } from './src/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';

// Yöneticiler Listesi
const ADMIN_EMAILS = ['caner192@hotmail.com'];

// --- Tool Definitions ---

const toolsDef: FunctionDeclaration[] = [
  {
    name: 'addTask',
    description: 'Yeni bir iş veya müşteri ekle.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'İşin veya müşterinin adı (Örn: Daire 5, Ahmet Bey)' },
        column: {
          type: Type.STRING,
          description: 'Durum kolonu: TO_CHECK, CHECK_COMPLETED, DEPOSIT_PAID, GAS_OPENED, SERVICE_DIRECTED'
        },
        assignee: { type: Type.STRING, description: 'İşin atandığı kişi' },
        phone: { type: Type.STRING, description: 'Müşteri telefon numarası' },
        address: { type: Type.STRING, description: 'Müşteri adresi veya daire bilgisi' }
      },
      required: ['title'],
    },
  },
  {
    name: 'moveTask',
    description: 'Bir işi başka bir aşamaya taşı.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchTitle: { type: Type.STRING, description: 'Taşınacak işin adı' },
        targetColumn: {
          type: Type.STRING,
          description: 'Hedef kolon: TO_CHECK, CHECK_COMPLETED, DEPOSIT_PAID, GAS_OPENED, SERVICE_DIRECTED'
        },
      },
      required: ['searchTitle', 'targetColumn'],
    },
  },
  {
    name: 'getBoardStatus',
    description: 'Tüm işlerin durumunu özetle.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

import Sidebar from './components/Sidebar';

// ... (Existing Imports) ...

export default function App() {
  // ... (Existing State) ...
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // Default to board view

  // ... (Existing Effects & Functions) ...

  if (loading) return <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-500">Yükleniyor...</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={user && ADMIN_EMAILS.includes(user.email || '')}
      />

      {/* Main Layout Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <Layout className="w-5 h-5 transform rotate-90" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span>Uygulama</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-900">Proje Panosu</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Gemini Button */}
            <div className="bg-slate-100/50 rounded-full px-1 py-1 border border-slate-200 flex items-center">
              {!connected ? (
                <button
                  onClick={connectToGemini}
                  className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-all"
                  title="Sesli Asistanı Başlat"
                >
                  <MicOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Asistan</span>
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-all animate-pulse"
                  title="Bağlantıyı Kes"
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Dinliyor...</span>
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user.displayName || user.email?.split('@')[0]}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Mühendis Hesabı</div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Action Toolbar */}
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Günlük Operasyon</h2>
            <p className="text-slate-500 text-sm mt-1">Bugünkü iş akışınızı yönetin ve takip edin.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsAppointmentsModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-sm"
            >
              Dipos Randevular
            </button>

            <button
              onClick={handleAddTaskClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Yeni Müşteri
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden px-8 pb-8">
          <div className="h-full bg-slate-100/50 rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col relative backdrop-blur-sm">
            <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        </div>

      </div>

      {/* Modals & Overlays - Same logic */}
      < TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)
        }
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        nextOrderNumber={nextOrderNumber}
        isAdmin={user && ADMIN_EMAILS.includes(user.email || '')}
      />

      < AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onSaveSettings={handleSaveSettings}
        initialSettings={appSettings}
        users={ADMIN_EMAILS}
        tasks={tasks}
        onTasksUpdate={(newTasks) => {
          console.log("Yeni görevler yüklendi:", newTasks);
          setTasks(newTasks);
        }}
      />

      < AppointmentsModal
        isOpen={isAppointmentsModalOpen}
        onClose={() => setIsAppointmentsModalOpen(false)}
      />

      {/* Toast Notification */}
      {
        toast.visible && (
          <div className="fixed bottom-6 right-6 bg-white border border-slate-100 text-slate-800 px-6 py-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-slideIn z-50 ring-1 ring-black/5">
            <div className="bg-blue-50 p-2.5 rounded-full">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Bildirim</h4>
              <p className="text-sm text-slate-500">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, visible: false })} className="text-slate-400 hover:text-slate-600 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      }
    </div>
  );
}