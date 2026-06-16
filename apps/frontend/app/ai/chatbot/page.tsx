'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Bot, Send, Sparkles, User, RefreshCw, Trash2, Download } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'bot',
    text: 'Halo! Saya asisten AI ERP Gentong Mas. Saya dapat membantu Anda dengan pertanyaan seputar penjualan, stok, keuangan, dan operasional bisnis. Apa yang ingin Anda tanyakan?',
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_PROMPTS = [
  'Berapa total penjualan bulan ini?',
  'Produk apa yang stoknya hampir habis?',
  'Tampilkan 5 pelanggan terbesar',
  'Siapa sales terbaik bulan ini?',
  'Berapa laba kotor bulan lalu?',
  'Invoice mana yang sudah jatuh tempo?',
  'Ringkasan pembelian minggu ini',
  'Karyawan mana yang absen hari ini?',
];

const AI_RESPONSES: Record<string, string> = {
  'penjualan bulan ini': '📊 **Total Penjualan Mei 2026**\n\nRevenue: **Rp 285.400.000**\n- Sales Order: 547 transaksi\n- Rata-rata per order: Rp 521.755\n- Growth vs April: **+12.5%** ✅\n\nTop 3 produk:\n1. Semen Portland — Rp 84 jt\n2. Bata Merah — Rp 42 jt\n3. Besi Beton — Rp 31 jt',
  'stok hampir habis': '⚠️ **Stok Rendah (< Minimum)**\n\n1. Semen Portland 50kg — 5 sak tersisa (min: 50)\n2. Cat Tembok Putih 25kg — 8 pcs (min: 20)\n3. Paku Beton 5cm — 2 dos (min: 10)\n4. Kawat Bendrat — 3 roll (min: 15)\n\n💡 Saran: Buat Purchase Request untuk item di atas?',
  'pelanggan terbesar': '👥 **Top 5 Pelanggan (Mei 2026)**\n\n1. PT Sinar Jaya — Rp 48.200.000\n2. CV Maju Bersama — Rp 32.100.000\n3. PT Indah Lestari — Rp 28.750.000\n4. UD Berkah Jaya — Rp 19.800.000\n5. Toko Sejahtera — Rp 15.400.000',
  'sales terbaik': '🏆 **Top Sales Bulan Ini**\n\n1. Budi Santoso — Rp 68 jt (24 order)\n2. Siti Rahayu — Rp 54 jt (18 order)\n3. Ahmad Fauzi — Rp 47 jt (21 order)\n\nTarget bulanan: Rp 200 jt\nCurrent: Rp 169 jt (84.5% tercapai) 📈',
  'laba': '💰 **Laporan Laba Rugi April 2026**\n\nRevenue: Rp 253.800.000\nHPP: Rp 178.400.000\n**Laba Kotor: Rp 75.400.000** (29.7%)\n\nBiaya Operasional: Rp 38.200.000\n**Laba Bersih: Rp 37.200.000** (14.7%)\n\nGrowth vs Maret: +8.2% ✅',
  'invoice jatuh tempo': '📋 **Invoice Outstanding**\n\n🔴 Jatuh tempo hari ini (3):\n- INV-2026-0841 · PT Sinar Jaya · Rp 4.500.000\n- INV-2026-0839 · CV Maju · Rp 2.100.000\n- INV-2026-0835 · UD Berkah · Rp 1.750.000\n\n🟡 Jatuh tempo besok (4):\nTotal: Rp 12.800.000\n\n💬 Kirim reminder WhatsApp otomatis?',
  'pembelian minggu ini': '🛒 **Ringkasan Pembelian Minggu Ini**\n\nTotal PO: 8 dokumen\nNilai Total: Rp 124.500.000\nStatus: 3 diterima, 2 dalam proses, 3 pending\n\nSupplier terbanyak: PT Semen Indonesia (3 PO)\nItem terbanyak: Semen & Material Bangunan',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key.split(' ')[0]) || lower.includes(key)) {
      return response;
    }
  }
  return `Terima kasih atas pertanyaan Anda tentang "${input}".\n\nSaat ini saya sedang menganalisis data dari sistem ERP Gentong Mas. Fitur AI analitik real-time akan segera tersedia sepenuhnya dan akan terhubung langsung dengan seluruh modul ERP.\n\nUntuk sementara, Anda dapat mengakses:\n• Laporan Penjualan di menu Laporan\n• Data Stok di menu Inventory\n• Laporan Keuangan di menu Akuntansi`;
}

function AiChatbotPageContent() {
  const { token } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    const q = searchParams.get('q');
    if (q) {
      setTimeout(() => send(q), 500);
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text, time: now }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: getAIResponse(text),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setLoading(false);
    }, 1200);
  };



  return (
    <OdooLayout title="AI Chat Assistant" subtitle="Tanya apapun tentang bisnis Anda">
      <div className="flex flex-col h-[calc(100vh-130px)] max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold" style={{ color: '#1E1B4B' }}>AI Chat Assistant</h1>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Terhubung ke semua modul ERP · GPT-4 Powered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(34,197,94,.1)', color: '#22C55E' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </div>
            <button onClick={() => setMessages(INITIAL_MESSAGES)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Reset chat" style={{ color: '#9CA3AF' }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition hover:shadow-sm"
              style={{ border: '1.5px solid #EDE9FE', color: '#5B52D1', backgroundColor: 'white' }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-2xl p-5"
          style={{ border: '1.5px solid #EDE9FE', backgroundColor: '#FAFAFA' }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'bot' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-1" style={{ maxWidth: '75%', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm whitespace-pre-line"
                  style={{
                    backgroundColor: m.role === 'user' ? '#5B52D1' : '#FFFFFF',
                    color: m.role === 'user' ? 'white' : '#1E1B4B',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: m.role === 'bot' ? 4 : 16,
                    border: m.role === 'bot' ? '1.5px solid #EDE9FE' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                  }}
                >
                  {m.text}
                </div>
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{m.time}</span>
              </div>
              {m.role === 'user' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border flex items-center gap-2" style={{ borderColor: '#EDE9FE' }}>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ color: '#5B52D1' }} />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>AI sedang memproses...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ border: '1.5px solid #EDE9FE', backgroundColor: '#FFFFFF' }}>
            <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: '#5B52D1' }} />
            <input
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: '#1E1B4B' }}
              placeholder="Tanyakan apapun tentang bisnis Anda..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
          </div>
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center h-12 w-12 rounded-2xl text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </OdooLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Memuat chatbot…</div>}>
      <AiChatbotPageContent />
    </Suspense>
  );
}
