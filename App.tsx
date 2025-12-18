/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from '@google/genai';
import * as XLSX from 'xlsx';
import { Mic, MicOff, Layout, Plus, LogOut, Settings, Bell, X, ChevronLeft, Search } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import Reports from './components/Reports';
import Visualizer from './components/Visualizer';
import TaskModal from './components/TaskModal';
import AppointmentsModal from './components/AppointmentsModal';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import StatsOverview from './components/StatsOverview';
import OperationsReport from './components/OperationsReport';
import Dashboard from './components/Dashboard';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ notifications: {} });
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard Navigation State
  const [viewMode, setViewMode] = useState<'dashboard' | 'board'>('dashboard');
  const [boardFilter, setBoardFilter] = useState<TaskStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  // Settings Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as AppSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  // Notification Logic
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const task = change.doc.data() as Task;
          const targetEmails = appSettings.notifications?.[task.status] || [];

          if (targetEmails.length > 0) {
            console.log(`Bildirim gönderiliyor: ${targetEmails.join(', ')} -> ${task.title} - ${task.status}`);

            setToast({
              message: `${task.title} işi "${StatusLabels[task.status]}" aşamasına geldi.`,
              visible: true
            });

            setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);

            if (targetEmails.includes(user.email || '')) {
              const message = `${task.title} - ${StatusLabels[task.status]} aşamasına geldi.`;

              try {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('İş Durumu Güncellendi', {
                    body: message,
                    icon: '/icon.png'
                  });
                }
              } catch (e) {
                console.log('Notification API not supported');
              }

              setToast({ message, visible: true });
              setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);

              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
              } catch (e) {
                console.log('Audio API error', e);
              }
            }
          }
        }
      });
    });

    try {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    } catch (e) {
      console.log('Notification permission error', e);
    }

    return () => unsubscribe();
  }, [user, appSettings]);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings);
      setIsAdminPanelOpen(false);
    } catch (e) {
      console.error("Error saving settings: ", e);
      setError("Ayarlar kaydedilemedi.");
    }
  };

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Keep track of tasks in a ref for the tool callbacks
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'tasks'), orderBy('orderNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(fetchedTasks);
    });

    return () => unsubscribe();
  }, [user]);

  const nextOrderNumber = tasks.length > 0 ? Math.max(...tasks.map(t => t.orderNumber)) + 1 : 1;

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tasks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "İş Listesi");
    XLSX.writeFile(wb, "Is_Takip_Listesi.xlsx");
    setToast({ message: "Excel dosyası indirildi.", visible: true });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as Task[];

      data.forEach(async (task) => {
        const { id, ...taskData } = task;
        try {
          await addDoc(collection(db, 'tasks'), {
            ...taskData,
            createdAt: serverTimestamp(),
            createdBy: user?.email || 'Excel Import',
            lastUpdatedBy: user?.email || 'Excel Import'
          });
        } catch (error) {
          console.error("Error adding document: ", error);
        }
      });
      alert('Veriler başarıyla yüklendi!');
    };
    reader.readAsBinaryString(file);
  };

  // Tab Switching Logic
  const handleTabChange = (tab: string) => {
    if (tab === 'settings') {
      setIsAdminPanelOpen(true);
      return;
    }
    if (tab === 'reports') {
      setActiveTab(tab);
      return;
    }
    setActiveTab(tab);
    if (tab === 'dashboard') {
      setViewMode('dashboard');
    }
  };

  const handleAddTaskClick = () => {
    setSelectedTask(undefined);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask) {
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, { ...taskData, lastUpdatedBy: user?.email });
      } else {
        await addDoc(collection(db, 'tasks'), {
          orderNumber: nextOrderNumber,
          title: taskData.title || 'Yeni Müşteri',
          jobDescription: taskData.jobDescription || '',
          status: taskData.status || TaskStatus.TO_CHECK,
          assignee: taskData.assignee || '',
          date: taskData.date || new Date().toISOString(),
          address: taskData.address || '',
          phone: taskData.phone || '',
          generalNote: taskData.generalNote || '',
          teamNote: taskData.teamNote || '',
          checkStatus: taskData.checkStatus,
          gasOpeningDate: taskData.gasOpeningDate || '',
          gasNote: taskData.gasNote || '',
          serviceSerialNumber: taskData.serviceSerialNumber || '',
          serviceNote: taskData.serviceNote || '',
          createdBy: user?.email,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving task: ", e);
      setError("Kayıt sırasında hata oluştu.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error deleting task: ", e);
      setError("Silme sırasında hata oluştu.");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const connectToGemini = async () => {
    try {
      setError(null);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: [{ functionDeclarations: toolsDef }],
          responseModalities: [Modality.AUDIO],
          systemInstruction: `Sen bir iş akış yöneticisisin. Aşağıdaki 5 aşamalı süreci yönetiyorsun:
        1. TO_CHECK: Kontrolü Yapılacak İşler (İlk aşama)
        2. CHECK_COMPLETED: Kontrolü Yapılan İşler (İkinci aşama)
        3. DEPOSIT_PAID: Depozito Yatırıldı
        4. GAS_OPENED: Gaz Açıldı
        5. SERVICE_DIRECTED: Servis Yönlendirildi

        Kullanıcı Türkçe konuşacak.
        Müşteri eklerken adres veya telefon bilgisi verilirse onları da kaydet.
        "Sıra no" veya "Numara" denirse ilgili kartın numarasını söyleyebilirsin.
        Profesyonel ve yardımsever ol.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened');
            setConnected(true);
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => { session.sendRealtimeInput({ media: pcmBlob }); });
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              const functionResponses: any[] = [];
              if (msg.toolCall?.functionCalls) {
                for (const fc of msg.toolCall.functionCalls) {
                  let result: any = { status: 'error', message: 'Bilinmeyen işlem' };
                  if (fc.name === 'addTask') {
                    const currentMaxOrder = tasksRef.current.length > 0 ? Math.max(...tasksRef.current.map(t => t.orderNumber)) : 0;
                    const newOrder = currentMaxOrder + 1;
                    const args = fc.args as any;
                    try {
                      const docRef = await addDoc(collection(db, 'tasks'), {
                        orderNumber: newOrder,
                        title: args.title,
                        status: args.column ? args.column as TaskStatus : TaskStatus.TO_CHECK,
                        assignee: args.assignee || 'Atanmadı',
                        phone: args.phone || '',
                        address: args.address || '',
                        createdBy: user?.email,
                        createdAt: serverTimestamp()
                      });
                      result = { status: 'success', taskId: docRef.id, orderNumber: newOrder, message: 'İş eklendi' };
                    } catch (e) { result = { status: 'error', message: 'Veritabanı hatası' }; }
                  }
                  else if (fc.name === 'moveTask') {
                    const search = ((fc.args as any).searchTitle || '').toLowerCase();
                    const target = (fc.args as any).targetColumn;
                    const task = tasksRef.current.find(t => t.title.toLowerCase().includes(search));
                    if (task) {
                      try {
                        await updateDoc(doc(db, 'tasks', task.id), { status: target as TaskStatus, lastUpdatedBy: user?.email });
                        result = { status: 'success', message: `"${task.title}" taşındı: ${target}` };
                      } catch (e) { result = { status: 'error', message: 'Güncelleme hatası' }; }
                    } else { result = { status: 'not_found', message: 'İş bulunamadı' }; }
                  }
                  else if (fc.name === 'getBoardStatus') {
                    const summary = tasksRef.current.map(t => `No:${t.orderNumber} ${t.title} (${t.status})`).join(', ');
                    result = { total: tasksRef.current.length, summary };
                  }
                  functionResponses.push({ id: fc.id, name: fc.name, response: { result } });
                }
              }
              sessionPromise.then(session => { session.sendToolResponse({ functionResponses }); });
            }
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current;
              const buffer = base64ToArrayBuffer(audioData);
              const audioBuffer = pcmToAudioBuffer(buffer, ctx, 24000);
              const now = ctx.currentTime;
              const start = Math.max(now, nextStartTimeRef.current);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(start);
              nextStartTimeRef.current = start + audioBuffer.duration;
              source.onended = () => { if (ctx.currentTime >= nextStartTimeRef.current - 0.1) setIsSpeaking(false); };
            }
          },
          onclose: () => { console.log('Gemini Connection Closed'); disconnect(); },
          onerror: (err: any) => { console.error('Gemini Error:', err); setError("Bağlantı hatası oluştu."); disconnect(); }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) { console.error(e); setError("Mikrofon başlatılamadı."); setConnected(false); }
  };

  const disconnect = useCallback(() => {
    setConnected(false);
    setIsSpeaking(false);
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    audioContextRef.current?.close();
    mediaStreamRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    inputAudioContextRef.current = null;
    audioContextRef.current = null;
    nextStartTimeRef.current = 0;
    sessionPromiseRef.current?.then(session => {
      // @ts-ignore
      if (session.close) session.close();
    });
    sessionPromiseRef.current = null;
  }, []);

  if (loading) return <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-500">Yükleniyor...</div>;

  if (!user) {
    return <Login />;
  }

  // Dashboard Navigasyon Fonksiyonu
  const handleDashboardNavigate = (status?: TaskStatus) => {
    setBoardFilter(status);
    setViewMode('board');
  };

  const handleFilterMissing = () => {
    setSearchTerm('eksik');
    setBoardFilter(undefined);
    setViewMode('board');
  };

  // Content Selection Logic
  let content = null;
  if (activeTab === 'dashboard') {
    if (viewMode === 'dashboard') {
      content = (
        <Dashboard
          tasks={tasks}
          onNavigate={handleDashboardNavigate}
          onTaskClick={handleTaskClick}
          onFilterMissing={handleFilterMissing}
        />
      );
    } else {
      // Board View (Navigated from Dashboard or separate view)
      content = (
        <div className="flex-1 overflow-hidden bg-white/50 rounded-3xl border border-white/60 relative backdrop-blur-md shadow-lg shadow-slate-200/50 flex flex-col">
          <div className="p-4 border-b border-white/50 flex items-center gap-2">
            <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold text-sm">Dashboard'a Dön</span>
            </button>
          </div>
          <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} initialFilter={boardFilter} searchTerm={searchTerm} />
        </div>
      );
    }
  } else if (activeTab === 'projects' || activeTab === 'archive') {
    // Re-use Board for now, maybe filtered later
    content = (
      <div className="h-full bg-slate-100/50 rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col relative backdrop-blur-sm">
        <div className="h-full bg-slate-100/50 rounded-3xl border border-slate-200/60 overflow-hidden flex flex-col relative backdrop-blur-sm">
          <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} searchTerm={searchTerm} />
        </div>
        );
  } else if (activeTab === 'reports') {
          content = <Reports tasks={tasks} onExportExcel={handleExportExcel} />;
  }

        return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-indigo-50/40">

          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={user && ADMIN_EMAILS.includes(user.email || '')}
            onLogout={handleSignOut}
          />

          {/* Main Layout Column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

            {/* Top Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 w-full shrink-0 bg-[#2c3e50] border-b border-[#34495e] shadow-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 hover:bg-[#34495e] rounded-lg text-slate-400 transition-colors"
                >
                  <Layout className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="text-xl font-bold text-white">
                    {activeTab === 'dashboard' ? (viewMode === 'dashboard' ? 'Genel Bakış' : 'İş Listesi') :
                      activeTab === 'projects' ? 'Projeler' :
                        activeTab === 'archive' ? 'Arşiv' : 'Panel'}
                  </h1>
                  <p className="text-xs text-slate-400">
                    Hoş geldin, <span className="font-semibold text-blue-400">{user.displayName || user.email?.split('@')[0]}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Gemini Button */}
                <div className="bg-white rounded-full px-1 py-1 border border-slate-200 shadow-sm flex items-center">
                  {!connected ? (
                    <button
                      onClick={connectToGemini}
                      className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
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

                {/* Action Buttons */}
                <div className="flex gap-2 items-center">
                  {/* Search Bar */}
                  <div className="relative hidden md:block mr-2">
                    <input
                      type="text"
                      placeholder="Müşteri ara..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.length > 0) {
                          setBoardFilter(undefined); // Clear column filters to search everywhere
                          if (activeTab === 'dashboard' && viewMode !== 'board') {
                            setViewMode('board');
                          }
                        }
                      }}
                      className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    onClick={() => setIsAppointmentsModalOpen(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    Randevular
                  </button>

                  <button
                    onClick={handleAddTaskClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni İş
                  </button>
                </div>

              </div>
            </header>

            {/* Dynamic Content Area */}
            <div className="flex-1 overflow-hidden px-8 pb-8 w-full flex flex-col">
              {content}
            </div>

          </div>

          {/* Modals & Overlays */}
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            task={selectedTask}
            nextOrderNumber={nextOrderNumber}
            isAdmin={user && ADMIN_EMAILS.includes(user.email || '')}
          />

          <AdminPanel
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

          <AppointmentsModal
            isOpen={isAppointmentsModalOpen}
            onClose={() => setIsAppointmentsModalOpen(false)}
          />

          {/* Toast Notification */}
          {toast.visible && (
            <div className="fixed bottom-6 right-6 bg-white border border-slate-100 text-slate-600 px-6 py-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-slideIn z-50 ring-1 ring-black/5">
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
          )}
        </div>
        );
}