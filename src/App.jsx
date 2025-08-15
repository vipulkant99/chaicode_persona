import React, { useEffect, useMemo, useRef, useState } from "react";
import { AiPersona } from "./ai_persona";
import { LoaderOne } from "./loader";
import { desc } from "motion/react-client";

const BANNER = [
  "Welcome to imvkc terminal (v0.1.0)",
  "Type `chaicode_hitesh` to start conversation with hitesh sir",
];

function useThemeInit() {
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) document.documentElement.classList.add("dark");
  }, []);
}

export default function App() {
  useThemeInit();

  const [lines, setLines] = useState(() =>
    BANNER.map((text) => ({ type: "out", text }))
  );
  const [input, setInput] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [isDarkPrompt, setIsDarkPrompt] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [currentBot, setCurrentBot] = useState();

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const COMMANDS = {
    chaicode_hitesh: {
      desc: "Choose Hitesh Sir as your chat partner",
      run: () => {
        setCurrentBot("hitesh");
        return ["Hitesh Sir is now your chat partner"];
      },
    },
    chaicode_piyush: {
      desc: "Choose Piyush Sir as your chat partner",
      run: () => {
        setCurrentBot("piyush");
        return ["Piyush Sir is now your chat partner"];
      },
    },
    chaicode_toggle: {
      desc: "Toggle between your chat partners",
      run: () => {
        if (currentBot === "hitesh") {
          setCurrentBot("piyush");
          return ["Piyush Sir is now your chat partner"];
        } else if (currentBot === "piyush") {
          setCurrentBot("hitesh");
          return ["Hitesh Sir is now your chat partner"];
        } else {
          return [
            "First choose your chat partner either by chaicode_hitesh or chaicode_piyush",
          ];
        }
      },
    },
    help: {
      desc: "List available commands",
      run: () => [
        "Available commands:",
        "  help ----> Show this help",
        "  chaicode_hitesh ----> You will chat with hitesh sir",
        "  chaicode_piyush ----> You will chat with piyush sir",
        "  about----> About this site",
        "  theme [light|dark] ----> Toggle or set theme",
        "  clear ---- Clear the screen",
      ],
    },
    about: {
      desc: "About this site",
      run: () => [
        "This is a Persona AI chat bot of our Hitesh Sir and Piyush Sir.",
      ],
    },
    theme: {
      desc: "Toggle or set theme",
      run: (args, api) => {
        const root = document.documentElement;
        const arg = args[0]?.toLowerCase();
        const isDark = root.classList.contains("dark");

        if (!arg) {
          root.classList.toggle("dark");
          api.setPromptTheme(root.classList.contains("dark"));
          return [
            `Theme: ${root.classList.contains("dark") ? "dark" : "light"}`,
          ];
        }

        if (arg === "dark") {
          root.classList.add("dark");
          api.setPromptTheme(true);
          return ["Theme: dark"];
        }
        if (arg === "light") {
          root.classList.remove("dark");
          api.setPromptTheme(false);
          return ["Theme: light"];
        }
        return ["Usage: theme [light|dark]"];
      },
    },
    clear: {
      desc: "Clear the screen",
      run: (_args, api) => {
        api.clearScreen();
        return [];
      },
    },
  };

  const api = useMemo(
    () => ({
      clearScreen: () => setLines([]),
      setPromptTheme: setIsDarkPrompt,
    }),
    []
  );

  const prompt = useMemo(() => {
    const user = "guest";
    const host = "imvkc";
    return (
      <span>
        <span className="text-cyan-300">{user}</span>
        <span className="text-slate-400">@</span>
        <span className="text-fuchsia-300">{host}</span>
        <span className="text-slate-400">:</span>
        <span className="text-emerald-300">~/</span>
        <span className="text-slate-400">$</span>
      </span>
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    // focus the input on load / click anywhere
    const focus = () => inputRef.current?.focus();
    window.addEventListener("click", focus);
    focus();
    return () => window.removeEventListener("click", focus);
  }, []);

  const runCommand = async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setLines((l) => [...l, { type: "in", text: "" }]);
      return;
    }

    const [cmd, ...args] = trimmed.split(/\s+/);
    const spec = COMMANDS[cmd];

    setLines((l) => [...l, { type: "in", text: trimmed }]);

    if (!spec) {
      if (currentBot === undefined) {
        setLines((l) => [
          ...l,
          {
            type: "err",
            text: `First please select whom you wanna talk to hitesh sir or piyush sir. Try \`help\`.`,
          },
        ]);
        return;
      }
      setisLoading((set) => !set);
      const answer = await AiPersona({ query: raw, bot: currentBot });
      setLines((l) => [...l, { type: "out", text: answer }]);
      setisLoading((set) => !set);
      return;
    }

    const out = spec.run(args, api);
    if (Array.isArray(out)) {
      if (out.length === 0) return;
      setLines((l) => [...l, ...out.map((t) => ({ type: "out", text: t }))]);
    } else if (typeof out === "string") {
      setLines((l) => [...l, { type: "out", text: out }]);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setLines((l) => [...l, { type: "in", text: "" }]);
      return;
    }
    runCommand(input);
    setHistory((h) => [input, ...h]);
    setHistIdx(-1);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistIdx((i) => {
        const next = Math.min(i + 1, history.length - 1);
        setInput(history[next] ?? "");
        return next;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistIdx((i) => {
        const next = Math.max(i - 1, -1);
        setInput(next === -1 ? "" : history[next] ?? "");
        return next;
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      // simple autocomplete on command names
      const parts = input.trim().split(/\s+/);
      if (parts.length <= 1) {
        const matches = Object.keys(COMMANDS).filter((c) =>
          c.startsWith(parts[0] || "")
        );
        if (matches.length === 1) setInput(matches[0] + " ");
      }
    }
  };

  return (
    <div className="dark min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-200 antialiased">
      <main className="mx-auto max-w-4xl p-4 md:p-8">
        {/* Window chrome */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-2xl ring-1 ring-white/5 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-700/60 px-4 py-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
            <div className="ml-3 text-xs text-slate-400">imvkc — ~/</div>
            <button
              onClick={() => {
                document.documentElement.classList.toggle("dark");
                setIsDarkPrompt(
                  document.documentElement.classList.contains("dark")
                );
              }}
              className="ml-auto rounded-md border border-slate-700/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50"
              title="Toggle theme"
            >
              {isDarkPrompt ? "Dark" : "Light"}
            </button>
          </div>

          {/* Terminal body */}
          <div className="font-mono text-[15px] leading-relaxed">
            {/* Output lines */}
            <div className="px-4 py-3 md:px-6 md:py-4 space-y-1">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.type === "err" ? "text-rose-400" : "text-slate-200"
                  }
                >
                  {line.type === "in" ? (
                    <>
                      <span className="mr-2 text-cyan-300">{">"}</span>
                      <span className="select-none">{prompt}</span>
                    </>
                  ) : null}
                  <span className={line.type === "in" ? "text-sky-300" : ""}>
                    {line.text}
                  </span>
                </div>
              ))}

              {/* Prompt line */}
              {!isLoading && (
                <form onSubmit={onSubmit} className="flex items-center gap-2">
                  <span className="select-none">{prompt}</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                    placeholder="type a command… (try `help`)"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </form>
              )}
              {isLoading && <LoaderOne />}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Built with React + Tailwind · One-page static terminal
        </p>
      </main>
    </div>
  );
}
