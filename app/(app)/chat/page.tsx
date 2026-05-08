"use client";
import PageHeader, { Card } from "@/components/ui";
import { MessageCircle, Send } from "lucide-react";

const rooms = [
  { name: "Bếp — King's Grill Q.1", lastMsg: "OK nhé, chuẩn bị nguyên liệu cho event", time: "5p", unread: 3 },
  { name: "HR Team", lastMsg: "Đã gửi bảng lương tháng 5", time: "1h", unread: 0 },
  { name: "Quản lý chi nhánh", lastMsg: "Họp tuần thứ 6 lúc 9h", time: "2h", unread: 1 },
  { name: "Toàn công ty", lastMsg: "Thông báo nghỉ lễ 2/9", time: "1d", unread: 0 },
];

const messages = [
  { sender: "Võ Đức Huy", text: "Chuẩn bị nguyên liệu cho event 200 khách nhé", time: "14:30", me: false },
  { sender: "Bạn", text: "OK anh, em sẽ lên danh sách chiều nay", time: "14:32", me: true },
  { sender: "Võ Đức Huy", text: "Nhớ check kho trước khi đặt thêm", time: "14:33", me: false },
];

export default function ChatPage() {
  return (
    <>
      <PageHeader title="Chat nội bộ" subtitle="Nhắn tin nội bộ King's Grill" icon={MessageCircle} />
      <div className="grid md:grid-cols-3 gap-4" style={{ minHeight: "60vh" }}>
        {/* Room list */}
        <Card className="md:col-span-1">
          <div className="space-y-1">
            {rooms.map((r) => (
              <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
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
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          <div className="flex-1 space-y-3 mb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.me ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {!m.me && <p className="text-xs font-bold mb-1 opacity-70">{m.sender}</p>}
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.me ? "text-white/60" : "text-slate-400"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <input className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline-none" placeholder="Nhập tin nhắn..." />
            <button className="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center hover:bg-brand-700"><Send size={18} /></button>
          </div>
        </Card>
      </div>
    </>
  );
}
