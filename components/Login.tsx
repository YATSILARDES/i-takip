import React, { useState } from 'react';
import { auth } from '../src/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Layout, Lock, Mail, LogIn } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
                        <Layout className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">İş Akış Yöneticisi</h1>
                    <p className="text-slate-400 mt-2">
                        Hesabınıza Giriş Yapın
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">E-posta Adresi</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="ornek@sirket.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        Giriş Yap
                    </button>
                </form>

            </div>
        </div>
    );
}
