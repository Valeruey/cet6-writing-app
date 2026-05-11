import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">设置</h1>
      </div>

      {/* User info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-1">当前账号</p>
        <p className="text-sm font-medium text-gray-900">
          {supabase.auth.getSession().then ? "已登录" : "未登录"}
        </p>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">关于</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>CET-6 WriteLab v1.0.0</p>
          <p>六级写作实验室 - 外刊精读 + 写作练习 + 翻译练习 + AI 评分</p>
          <p>Powered by DeepSeek AI</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">功能</h3>
        <p className="text-xs text-gray-500">📖 每日期刊精读 + 高级表达标注</p>
        <p className="text-xs text-gray-500">✍️ AI 生成六级写作题目 + 评分</p>
        <p className="text-xs text-gray-500">🔄 历年六级翻译真题 + AI 评分</p>
        <p className="text-xs text-gray-500">📚 间隔重复复习系统 (SM-2)</p>
        <p className="text-xs text-gray-500">📱 PWA 离线支持</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full py-3 text-sm font-medium text-danger bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
      >
        {loggingOut ? "退出中..." : "退出登录"}
      </button>
    </div>
  );
}
