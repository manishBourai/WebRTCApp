import Sender from "@/utils/Sender";
import React, { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid"; // Install @heroicons/react if not already

interface SidebarProps {
  user: string;
  nav: { name: string; id: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, nav }) => {
  const [open, setOpen] = useState(false);
  const { setReceiver, setReceiverName } = Sender();
  const [selected, setSelected] = useState<string | null>(null);

  // Optional: handle focus for accessibility
  const handleClick = (id: string, name: string) => {
    setOpen(false);
    setReceiver(id);
    setReceiverName(name);
    setSelected(id);
  };

  return (
    <>
      {/* Hamburger (Mobile only) */}
      <button
        className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-slate-800/80 text-white shadow-xl focus:outline-none border border-indigo-400 hover:bg-indigo-600 transition`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {/* Hamburger/X Animated Icon */}
        <svg className="w-7 h-7 text-white transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-200"
            d={open ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"}
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 
          flex flex-col 
          bg-white/80 dark:bg-slate-900/90
          backdrop-blur-xl 
          border-r border-indigo-200 dark:border-indigo-800
          shadow-2xl
          w-72 min-h-screen px-7 py-8
          transition-transform duration-300 ease-[cubic-bezier(.85,-0.01,.23,1.01)]
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex
        `}
        style={{ height: "100vh" }}
      >
        {/* User Info */}
        <div className="flex items-center gap-4 mb-10">
          <UserCircleIcon className="w-12 h-12 text-indigo-400 drop-shadow" />
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{user}</div>
            <div className="text-xs bg-indigo-50 text-indigo-600 rounded px-2 py-0.5 mt-1 font-semibold shadow-sm">
              Online
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-2 mt-3">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`
                flex items-center gap-3 w-full px-4 py-2 rounded-lg font-medium
                transition-all duration-200
                ${selected === item.id
                  ? "bg-gradient-to-r from-indigo-500/80 to-indigo-700/80 text-white shadow-lg"
                  : "bg-white/0 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-800 dark:text-gray-200"}
                active:scale-[.98]
                outline-none focus:ring-2 focus:ring-indigo-200
                text-base
              `}
              onClick={() => handleClick(item.id, item.name)}
              tabIndex={0}
              aria-current={selected === item.id ? "page" : undefined}
            >
              {/* Optional: use an icon or avatar here per item */}
              <span
                className={`
                  block w-2.5 h-2.5 rounded-full mr-1 transition
                  ${selected === item.id ? "bg-white" : "bg-indigo-300"}
                `}
              />
              {item.name}
            </button>
          ))}
        </nav>

        {/* Add a soft gradient at the bottom for detail */}
        <div className="mt-auto h-12 w-full flex items-end">
          <div className="h-8 w-full rounded-b-xl bg-gradient-to-t from-indigo-200/40 to-transparent dark:from-indigo-900/30" />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-fadeIn md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar animation keyframes using Tailwind's animate utilities */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0 }
            to { opacity: 1 }
          }
          .animate-fadeIn {
            animation: fadeIn .24s cubic-bezier(.39, .575, .565, 1) both;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;
