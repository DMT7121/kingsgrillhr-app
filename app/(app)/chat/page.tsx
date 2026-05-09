"use client";
import PageHeader, { Card } from "@/components/ui";
import { MessageCircle, Send } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    async function loadRooms() {
      if (!isSupabaseConfigured) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRooms(data.map((r: any) => ({
          id: r.id,
          name: r.name,
          lastMessage: "",
        })));
        if (data.length > 0) setSelectedRoom(data[0].id);
      }
      setLoading(false);
    }
    loadRooms();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedRoom || !isSupabaseConfigured) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id, content, created_at,
          sender:sender_id ( full_name, employee_code )
        `)
        .eq("room_id", selectedRoom)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          sender: m.sender?.full_name || "Ẩn danh",
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          isOwn: m.sender?.employee_code === profile?.employee_id,
        })));
      }
    }
    loadMessages();
  }, [selectedRoom, profile?.employee_id]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedRoom || !profile?.employee_id) return;
    // Insert message to Supabase (if chat_messages table exists)
    await supabase.from("chat_messages").insert({
      room_id: selectedRoom,
      sender_id: profile.employee_id,
      content: newMsg.trim(),
    });
    setNewMsg("");
    // Reload messages
    const { data } = await supabase
      .from("chat_messages")
      .select(`id, content, created_at, sender:sender_id(full_name, employee_code)`)
      .eq("room_id", selectedRoom)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        sender: m.sender?.full_name || "Ẩn danh",
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isOwn: m.sender?.employee_code === profile?.employee_id,
      })));
    }
  };

  return (
    <>
      <PageHeader title="Chat nội bộ" subtitle="Nhắn tin nội bộ King's Grill" icon={MessageCircle} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: "60vh" }}>
        {/* Room list */}
        <Card className="md:col-span-1">
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Đang tải...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Chưa có phòng chat nào.</p>
          ) : (
            <div className="space-y-1">
              {rooms.map((r) => (
                <button key={r.id}
                  onClick={() => setSelectedRoom(r.id)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${selectedRoom === r.id ? "bg-brand-50 text-brand-700 font-bold" : "hover:bg-slate-50 text-slate-700"}`}>
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </Card>
        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          <div className="flex-1 space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Chưa có tin nhắn nào.</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.isOwn ? "justify-end" : ""}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.isOwn ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {!m.isOwn && <p className="text-xs font-bold mb-1">{m.sender}</p>}
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.isOwn ? "text-white/60" : "text-slate-400"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <input className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none"
              placeholder="Nhập tin nhắn..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <button onClick={handleSend} className="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center"><Send size={16} /></button>
          </div>
        </Card>
      </div>
    </>
  );
}
