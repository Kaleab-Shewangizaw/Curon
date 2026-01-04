"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check,
  Send,
  Plus,
  ChevronRight,
  Target,
  Sparkles,
  ListTodo,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import ActiveIntentChat from "./components/ActiveIntentChat";
import { ModeToggle } from "@/components/mode-toggle";

const USER_ID = "cmjynnuyj0000ftfariqgmngm";

interface Task {
  id: string | null;
  title: string;
  status: "pending" | "completed";
  priority: number | null;
}

interface Intent {
  id: string | null;
  title: string;
  tasks: Task[];
  status?: string;
  pendingQuestion?: string | null;
  type?: string;
}

interface AiResponse {
  action: "create" | "update" | "get" | "delete" | "ask";
  message: string | null;
  intents: Intent[];
}

interface LogItem {
  type: "user" | "system";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [allIntents, setAllIntents] = useState<Intent[]>([]);
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Manual CRUD State
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [newIntentTitle, setNewIntentTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    fetchIntents();
  }, []);

  const fetchIntents = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/getIntents/${USER_ID}`
      );
      if (response.ok) {
        const data = await response.json();
        setAllIntents(data);
      }
    } catch (e) {
      console.error("Failed to fetch intents:", e);
    }
  };

  // --- Manual CRUD Operations ---

  const handleCreateIntent = async () => {
    if (!newIntentTitle.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/createIntent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newIntentTitle,
          userId: USER_ID,
          description: "Manually created project",
          thoughtId: "manual", // Placeholder or handle in backend
        }),
      });
      if (res.ok) {
        setNewIntentTitle("");
        setIsCreatingIntent(false);
        fetchIntents();
      }
    } catch (e) {
      console.error("Failed to create intent:", e);
    }
  };

  const handleDeleteIntent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the intent
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`http://localhost:5000/deleteIntent/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (activeIntentId === id) setActiveIntentId(null);
        fetchIntents();
      }
    } catch (e) {
      console.error("Failed to delete intent:", e);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !activeIntentId) return;
    try {
      const res = await fetch("http://localhost:5000/createTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          intentId: activeIntentId,
          priority: 5, // Default priority
        }),
      });
      if (res.ok) {
        setNewTaskTitle("");
        fetchIntents();
      }
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };

  const handleToggleTaskStatus = async (
    taskId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "completed" ? false : true;
      const res = await fetch(`http://localhost:5000/updateTask/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          done: newStatus,
        }),
      });
      if (res.ok) {
        fetchIntents();
      }
    } catch (e) {
      console.error("Failed to update task:", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`http://localhost:5000/deleteTask/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchIntents();
      }
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  const addToLog = (type: "user" | "system", content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const processPrompt = async () => {
    if (!prompt.trim()) return;

    const userText = prompt;
    setPrompt("");
    setPendingQuestion(null);
    addToLog("user", userText);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/getPrompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, userId: USER_ID }),
      });

      const data: AiResponse = await response.json();

      if (data.message) {
        addToLog("system", data.message);
      } else if (data.action === "create") {
        addToLog("system", "Created a new plan.");
      } else if (data.action === "update") {
        addToLog("system", "Updated plan.");
      }

      if (data.action === "ask") {
        setPendingQuestion(data.message);
      }

      if (data.intents && data.intents.length > 0) {
        const processedIntents = data.intents.map((i) => ({
          ...i,
          title: i.type || i.title || "Untitled Intent",
        }));

        if (data.action === "get") {
          if (processedIntents.length === 1) {
            setAllIntents((prev) => {
              const newMap = new Map(prev.map((i) => [i.id, i]));
              processedIntents.forEach((i) => {
                if (i.id) newMap.set(i.id, i);
              });
              return Array.from(newMap.values());
            });
            setActiveIntentId(processedIntents[0].id);
          } else {
            setAllIntents(processedIntents);
            if (processedIntents.length > 0 && !activeIntentId) {
              setActiveIntentId(processedIntents[0].id);
            }
          }
        } else {
          setAllIntents((prev) => {
            const newMap = new Map(prev.map((i) => [i.id, i]));
            processedIntents.forEach((i) => {
              if (i.id) newMap.set(i.id, i);
            });
            return Array.from(newMap.values());
          });

          if (processedIntents.length > 0 && processedIntents[0].id) {
            setActiveIntentId(processedIntents[0].id);
          }
        }
      }
    } catch (error) {
      console.error(error);
      addToLog("system", "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      processPrompt();
    }
  };

  const activeIntent = allIntents.find((i) => i.id === activeIntentId) || null;

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative flex flex-1">
        {/* Left Sidebar */}
        <div
          className={`h-full border-r border-border bg-background/80 backdrop-blur-sm transition-all duration-200 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center" : "justify-between"
              } p-4 border-b border-border`}
            >
              {sidebarCollapsed ? (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 hover:opacity-90 transition-opacity"
                >
                  <Target className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70">
                      <Target className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold">CURON</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ModeToggle />
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="rounded-md p-1.5 hover:bg-muted"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {!sidebarCollapsed && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between px-2">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      Projects
                    </span>
                    <button
                      onClick={() => setIsCreatingIntent(!isCreatingIntent)}
                      className="rounded-md p-1 hover:bg-muted"
                    >
                      {isCreatingIntent ? (
                        <X className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {isCreatingIntent && (
                    <div className="mb-2 px-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="New Project Name..."
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={newIntentTitle}
                        onChange={(e) => setNewIntentTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateIntent();
                          if (e.key === "Escape") setIsCreatingIntent(false);
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    {allIntents.length === 0 && !isCreatingIntent ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No projects
                      </div>
                    ) : (
                      allIntents.map((intent) => (
                        <div
                          key={intent.id}
                          className="group relative flex items-center"
                        >
                          <button
                            onClick={() => setActiveIntentId(intent.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              activeIntentId === intent.id
                                ? "bg-primary/10 text-foreground"
                                : "hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div
                                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                  activeIntentId === intent.id
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30"
                                }`}
                              />
                              <span className="truncate">{intent.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {intent.status === "CLARIFICATION_REQUESTED" && (
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              )}
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground group-hover:opacity-0 transition-opacity">
                                {
                                  intent.tasks.filter(
                                    (t) => t.status === "pending"
                                  ).length
                                }
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => handleDeleteIntent(intent.id!, e)}
                            className="absolute right-2 hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                            title="Delete Project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeIntent ? (
            <>
              {/* Header */}
              <div className="border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Active Project
                      </span>
                      {activeIntent.status === "CLARIFICATION_REQUESTED" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Needs Input
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">
                      {activeIntent.title}
                    </h1>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ListTodo className="h-4 w-4" />
                        <span>
                          {
                            activeIntent.tasks.filter(
                              (t) => t.status === "pending"
                            ).length
                          }{" "}
                          pending
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Check className="h-4 w-4" />
                        <span>
                          {
                            activeIntent.tasks.filter(
                              (t) => t.status === "completed"
                            ).length
                          }{" "}
                          completed
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${
                                activeIntent.tasks.length > 0
                                  ? (activeIntent.tasks.filter(
                                      (t) => t.status === "completed"
                                    ).length /
                                      activeIntent.tasks.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {activeIntent.tasks.length > 0
                            ? Math.round(
                                (activeIntent.tasks.filter(
                                  (t) => t.status === "completed"
                                ).length /
                                  activeIntent.tasks.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-1 overflow-hidden p-6">
                <div className="grid flex-1 grid-cols-3 gap-6 overflow-hidden">
                  {/* Tasks Column */}
                  <div className="col-span-2 flex flex-col overflow-hidden rounded-lg border border-border bg-background/80 backdrop-blur-sm">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-lg font-medium text-foreground">
                        Tasks
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-3">
                        {activeIntent.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`group relative rounded-lg border p-4 transition-colors ${
                              task.status === "completed"
                                ? "border-border/50 bg-muted/30"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() =>
                                  handleToggleTaskStatus(task.id!, task.status)
                                }
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                                  task.status === "completed"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground hover:border-primary"
                                }`}
                              >
                                {task.status === "completed" && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    task.status === "completed"
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                {task.priority !== null && (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-muted-foreground">
                                        Priority
                                      </div>
                                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                          className="h-full bg-primary"
                                          style={{
                                            width: `${task.priority * 10}%`,
                                          }}
                                        />
                                      </div>
                                      <div className="text-xs font-medium text-foreground">
                                        {task.priority}/10
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id!)}
                                className="absolute right-2 top-2 hidden rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                                title="Delete Task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add New Task Input */}
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border p-3 transition-colors hover:border-primary/50">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Add a new task..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateTask();
                            }}
                          />
                          {newTaskTitle && (
                            <button
                              onClick={handleCreateTask}
                              className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                            >
                              Add
                            </button>
                          )}
                        </div>

                        {activeIntent.tasks.length === 0 && !newTaskTitle && (
                          <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-sm text-muted-foreground">
                              No tasks yet
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              Add tasks manually or using the chat
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Column */}
                  <div className="col-span-1 flex flex-col overflow-hidden rounded-lg border border-border bg-background/80 backdrop-blur-sm">
                    <div className="border-b border-border px-4 py-3">
                      <h2 className="text-lg font-medium text-foreground">
                        Project Chat
                      </h2>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ActiveIntentChat
                        intentId={activeIntent.id!}
                        intentTitle={activeIntent.title}
                        onUpdate={fetchIntents}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                <Target className="h-12 w-12 text-primary/40" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                No Project Selected
              </h2>
              <p className="text-center text-muted-foreground">
                Select a project from the sidebar or start a conversation
                <br />
                with the assistant to create one.
              </p>
            </div>
          )}
        </div>

        {/* Assistant Panel */}
        <div className="h-full w-80 border-l border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    AI Assistant
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Always available
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Chat History */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                {logs.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-4">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Start a conversation with the AI assistant
                    </p>
                    <p className="mt-1 text-center text-xs text-muted-foreground/70">
                      Ask questions or give instructions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          log.type === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-4 text-sm ${
                            log.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{log.content}</p>
                          <div
                            className={`mt-2 text-xs ${
                              log.type === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {log.type === "user" ? "You" : "Assistant"} •{" "}
                            {log.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-muted p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex gap-1">
                              <div
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                style={{ animationDelay: "0ms" }}
                              />
                              <div
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                style={{ animationDelay: "150ms" }}
                              />
                              <div
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-background/50 p-4">
                {pendingQuestion && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/30">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        Follow-up Question
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {pendingQuestion}
                    </p>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    placeholder={
                      pendingQuestion
                        ? "Type your response..."
                        : "Type your message..."
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    onClick={processPrompt}
                    disabled={loading || !prompt.trim()}
                    className="absolute bottom-3 right-3 rounded-md bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
