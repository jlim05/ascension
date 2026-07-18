import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

export default function NotificationToast() {
  const { notifications, removeNotification, startConnection, stopConnection } =
    useNotificationStore();
  const { token } = useAuthStore();

  // Start SignalR connection when logged in
  useEffect(() => {
    if (token) {
      startConnection(token);
    } else {
      stopConnection();
    }
    return () => {
      stopConnection();
    };
  }, [token]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="relative overflow-hidden p-4 font-mono-game text-xs"
          style={{
            background:
              n.type === "levelup"
                ? "rgba(20, 16, 0, 0.95)"
                : n.type === "gate"
                ? "rgba(20, 14, 0, 0.95)"
                : "rgba(12, 14, 18, 0.95)",
            border:
              n.type === "levelup"
                ? "1px solid #e9c400"
                : n.type === "gate"
                ? "1px solid rgba(202,138,4,0.6)"
                : "1px solid var(--primary-cyan)",
            boxShadow:
              n.type === "levelup"
                ? "0 0 30px rgba(233,196,0,0.3)"
                : n.type === "gate"
                ? "0 0 20px rgba(202,138,4,0.2)"
                : "0 0 20px rgba(116,245,255,0.2)",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                n.type === "levelup"
                  ? "#e9c400"
                  : n.type === "gate"
                  ? "#ca8a04"
                  : "var(--primary-cyan)",
            }}
          />

          <p
            className="uppercase tracking-widest leading-relaxed"
            style={{
              color:
                n.type === "levelup"
                  ? "#e9c400"
                  : n.type === "gate"
                  ? "#ca8a04"
                  : "var(--primary-cyan)",
            }}
          >
            {n.message}
          </p>

          {/* Close button */}
          <button
            onClick={() => removeNotification(n.id)}
            className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors"
            style={{ fontSize: "16px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}