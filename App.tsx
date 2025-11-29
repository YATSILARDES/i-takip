import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from '@google/genai';
import * as XLSX from 'xlsx';
import { Mic, MicOff, Layout, Plus, LogOut, Settings } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import Visualizer from './components/Visualizer';
import TaskModal from './components/TaskModal';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import { Task, TaskStatus, AppSettings } from './types';
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
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ gasNotificationEmail: '' });

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
    if (!user || !appSettings.gasNotificationEmail) return;

    // Sadece hedef kullanıcıysak dinleyelim
    if (user.email !== appSettings.gasNotificationEmail) return;

    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const task = change.doc.data() as Task;
          // Eğer durum GAS_OPENED olduysa ve önceki durum farklıysa (basitçe şu anki duruma bakıyoruz, daha detaylı kontrol için previous state gerekebilir ama real-time'da bu yeterli olabilir)
          // Ancak modified her değişiklikte tetiklenir. Sadece status değiştiğinde uyarı vermek için:
          // Burada basit bir kontrol yapıyoruz: Eğer task.status === GAS_OPENED ise ve bu değişiklik yeni geldiyse.
          // Daha sağlam bir yöntem: change.doc.data().status === GAS_OPENED

          if (task.status === TaskStatus.GAS_OPENED) {
            // Bildirim Gönder
            new Notification('Gaz Açıldı!', {
              body: `${task.title} - ${task.address || ''}`,
              icon: '/icon.png' // Varsa ikon yolu
            });

            // Ses Çal
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Basit bir bildirim sesi
            audio.play().catch(e => console.log('Audio play failed', e));
          }
        }
      });
    });

    // Bildirim izni iste
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, [user, appSettings]);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings);
      setIsSettingsOpen(false);
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

  // Calculate next Order Number
  const nextOrderNumber = tasks.length > 0 ? Math.max(...tasks.map(t => t.orderNumber)) + 1 : 1;

  // Excel'e Aktar (Export)
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tasks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "İş Listesi");
    XLSX.writeFile(wb, "Is_Takip_Listesi.xlsx");
  };

  // Excel'den Yükle (Import)
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

      // Verileri Firestore'a ekle
      data.forEach(async (task) => {
        // ID çakışmasını önlemek için yeni ID ile ekleyelim veya mevcut ID'yi kullanalım
        // Burada basitçe yeni kayıt olarak ekliyoruz.
        const { id, ...taskData } = task; // ID'yi çıkar, Firestore kendi ID'sini versin
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

  // Handlers
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
        // Edit Mode
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, { ...taskData, lastUpdatedBy: user?.email });
      } else {
        // Add Mode
        await addDoc(collection(db, 'tasks'), {
          orderNumber: nextOrderNumber,
          title: taskData.title || 'Yeni Müşteri',
          jobDescription: taskData.jobDescription || '',
          status: taskData.status || TaskStatus.TO_CHECK,
          assignee: taskData.assignee || '',
          date: taskData.date || new Date().toISOString(),
          address: taskData.address || '',
          phone: taskData.phone || '',

          // New Fields
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
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
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
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
          }
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
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);

            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              console.log('Tool Call Received:', msg.toolCall);
              const functionResponses = [];

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
                  } catch (e) {
                    result = { status: 'error', message: 'Veritabanı hatası' };
                  }
                }
                else if (fc.name === 'moveTask') {
                  const search = ((fc.args as any).searchTitle || '').toLowerCase();
                  const target = (fc.args as any).targetColumn;
                  const task = tasksRef.current.find(t => t.title.toLowerCase().includes(search));

                  if (task) {
                    try {
                      await updateDoc(doc(db, 'tasks', task.id), { status: target as TaskStatus, lastUpdatedBy: user?.email });
                      result = { status: 'success', message: `"${task.title}" taşındı: ${target}` };
                    } catch (e) {
                      result = { status: 'error', message: 'Güncelleme hatası' };
                    }
                  } else {
                    result = { status: 'not_found', message: 'İş bulunamadı' };
                  }
                }
                else if (fc.name === 'getBoardStatus') {
                  const summary = tasksRef.current.map(t => `No:${t.orderNumber} ${t.title} (${t.status})`).join(', ');
                  result = { total: tasksRef.current.length, summary };
                }

                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result }
                });
              }

              sessionPromise.then(session => {
                session.sendToolResponse({ functionResponses });
              });
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

              source.onended = () => {
                if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                  setIsSpeaking(false);
                }
              };
            }
          },
          onclose: () => {
            console.log('Gemini Connection Closed');
            disconnect();
          },
          onerror: (err) => {
            console.error('Gemini Error:', err);
            setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setError("Mikrofon veya bağlantı başlatılamadı.");
      setConnected(false);
    }
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

  if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-700 bg-slate-800 flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ONAY MÜHENDİSLİK İŞ TAKİBİ</h1>
            <p className="text-xs text-slate-400">Gemini 2.5 Live Destekli</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Yönetici Paneli */}
          {user && ADMIN_EMAILS.includes(user.email || '') && (
            <div className="flex items-center gap-2 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <span className="text-xs text-yellow-500 font-bold px-2">YÖNETİCİ</span>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                📥 İndir
              </button>
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 cursor-pointer">
                📤 Yükle
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
              </label>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-sm flex items-center gap-1 ml-2 border border-slate-600"
                title="Ayarlar"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && <span className="text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded-full border border-red-800">{error}</span>}
          <div className="flex items-center gap-3 bg-slate-900 rounded-full px-4 py-2 border border-slate-700">
            <Visualizer isActive={connected} isSpeaking={isSpeaking} />
            <div className="h-4 w-px bg-slate-700 mx-2"></div>
            <button
              onClick={connected ? disconnect : connectToGemini}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${connected
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                }`}
            >
              {connected ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Bağlantıyı Kes</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Canlı Bağlan</span>
                </>
              )}
            </button>
          </div>

          <div className="h-8 w-px bg-slate-700 mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user.email}</div>
              <div className="text-xs text-slate-500">Çevrimiçi</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-900 to-slate-800">
          {/* Toolbar */}
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-200">Günlük Operasyon</h2>

            <button
              onClick={handleAddTaskClick}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-green-500/20">
              <Plus className="w-4 h-4" />
              Müşteri Ekle
            </button>
          </div>

          {/* Board */}
          <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-600'}`}></div>
          <span>{connected ? 'Canlı Oturum Aktif' : 'Bağlanmaya Hazır'}</span>
        </div>
        <div>
          Toplam İş: {tasks.length}
        </div>
      </footer>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        nextOrderNumber={nextOrderNumber}
        isAdmin={user && ADMIN_EMAILS.includes(user.email || '')}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={appSettings}
      />
    </div>
  );
}