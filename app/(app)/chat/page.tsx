"use client";
import PageHeader, { Card } from "@/components/ui";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface Room {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  me: boolean;
}

const mockRooms: Room[] = [
  { id: "r1", name: "Bếp — King's Grill Q.1", lastMsg: "OK nhé, chuẩn bị nguyên liệu cho event", time: "5p", unread: 3 },
  { id: "r2", name: "HR Team", lastMsg: "Đã gửi bảng lương tháng 5", time: "1h", unread: 0 },
  { id: "r3", name: "Quản lý chi nhánh", lastMsg: "Họp tuần thứ 6 lúc 9h", time: "2h", unread: 1 },
  { id: "r4", name: "Toàn công ty", lastMsg: "Thông báo nghỉ lễ 2/9", time: "1d", unread: 0 },
];

const mockMessages: Message[] = [
  { id: "m1", sender: "Võ Đức Huy", text: "Chuẩn bị nguyên liệu cho event 200 khách nhé", time: "14:30", me: false },
  { id: "m2", sender: "Bạn", text: "OK anh, em sẽ lên danh sách chiều nay", time: "14:32", me: true },
  { id: "m3", sender: "Võ Đức Huy", text: "Nhớ check kho trước khi đặt thêm", time: "14:33", me: false },
];

export default function ChatPage() {
  const { profile } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    (async () => {
      const { data: chatRooms } = await supabase
        .from("chat_rooms")
        .select("id, name")
        .order("updated_at", { ascending: false });

      if (chatRooms && chatRooms.length > 0) {
        // Get last message for each room
        const roomList: Room[] = [];
        for (const room of chatRooms) {
          const { data: lastMsgs } = await supabase
            .from("chat_messages")
            .select("message, created_at")
            .eq("room_id", room.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(1);

          const last = lastMsgs?.[0];
          const diff = last ? Math.floor((Date.now() - new Date(last.created_at).getTime()) / 1000) : 0;
          let timeStr = "";
          if (!last) timeStr = "";
          else if (diff < 3600) timeStr = `${Math.max(1, Math.floor(diff / 60))}p`;
          else if (diff < 86400) timeStr = `${Math.floor(diff / 3600)}h`;
          else timeStr = `${Math.floor(diff / 86400)}d`;

          roomList.push({
            id: room.id,
            name: room.name,
            lastMsg: last?.message?.slice(0, 50) || "Chưa có tin nhắn",
            time: timeStr,
            unread: 0,
          });
        }
        setRooms(roomList);
        if (!selectedRoom && roomList.length > 0) setSelectedRoom(roomList[0].id);
      }
      setLoading(false);
    })();
  }, []);

  // Load messages when room changes
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedRoom) return;

    (async () => {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select(`
          id, message, created_at,
          sender:sender_id(full_name)
        `)
        .eq("room_id", selectedRoom)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (msgs) {
        const empId = profile?.employee_id;
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          sender: m.sender?.full_name || "Ẩn danh",
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          me: m.sender_id === empId,
        })));
      }
    })();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat-${selectedRoom}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedRoom}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => [...prev, {
          id: m.id,
          sender: "Mới",
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          me: m.sender_id === profile?.employee_id,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom, profile?.employee_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim()) return;
    if (!isSupabaseConfigured || !selectedRoom || !profile?.employee_id) {
      // Mock mode: add message locally
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        sender: "Bạn",
        text: msgInput,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        me: true,
      }]);
      setMsgInput("");
      return;
    }

    setSending(true);
    await supabase.from("chat_messages").insert({
      room_id: selectedRoom,
      sender_id: profile.employee_id,
      message: msgInput.trim(),
    });
    setMsgInput("");
    setSending(false);
  };

  return (
    <>
      <PageHeader title="Chat nội bộ" subtitle="Nhắn tin nội bộ King's Grill" icon={MessageCircle} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: "60vh" }}>
        {/* Room list */}
        <Card className="md:col-span-1">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-1">
              {rooms.map((r) => (
                <div key={r.id} onClick={() => setSelectedRoom(r.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedRoom === r.id ? "bg-brand-50" : "hover:bg-slate-50"}`}>
                  <div className="h-10 w-10 rounded-xl bg-brand-100 grid place-items-center text-brand-700 font-bold text-sm shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 truncate">{r.lastMsg}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400">{r.time}</p>
                    {r.unread > 0 && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white mt-1">{r.unread}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          <div className="flex-1 space-y-3 mb-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.me ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {!m.me && <p className="text-xs font-bold mb-1 opacity-70">{m.sender}</p>}
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.me ? "text-white/60" : "text-slate-400"}`}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <input
              className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none"
              placeholder="Nhập tin nhắn..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgInput.trim()}
              className="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
