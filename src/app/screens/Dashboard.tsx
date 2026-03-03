import { useState } from "react";
import { CheckCircle2, TrendingUp, Flame, Plus, FileText, CalendarDays, Check, MoreHorizontal } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "@/app/components/TaskCard";
import { ProductivityWidget } from "@/app/components/ProductivityWidget";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { toast } from "sonner";

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Q1 financial reports",
    completed: false,
    dueDate: "Feb 20",
    priority: "high",
    tags: ["Finance"],
    overdue: true,
  },
  {
    id: "2",
    title: "Prepare presentation for stakeholders",
    completed: false,
    dueDate: "Feb 26",
    priority: "high",
    tags: ["Meeting"],
  },
  {
    id: "3",
    title: "Update project roadmap",
    completed: false,
    dueDate: "Feb 26",
    priority: "medium",
    tags: ["Planning"],
  },
  {
    id: "4",
    title: "Call with design team",
    completed: true,
    dueDate: "Feb 25",
    tags: ["Meeting"],
  },
  {
    id: "5",
    title: "Review pull requests",
    completed: false,
    dueDate: "Feb 27",
    priority: "medium",
    tags: ["Development"],
  },
  {
    id: "6",
    title: "Write blog post about productivity",
    completed: false,
    dueDate: "Feb 28",
    tags: ["Content"],
  },
];

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    toast.success("Task updated");
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      dueDate: "Feb 26",
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
    toast.success("Task added");
  };

  const overdueTasks = tasks.filter((t) => t.overdue && !t.completed);
  const todayTasks = tasks.filter((t) => t.dueDate === "Feb 26" && !t.completed);
  const upcomingTasks = tasks.filter((t) => !t.completed && !t.overdue && t.dueDate !== "Feb 26");
  const completedToday = tasks.filter((t) => t.completed && t.dueDate === "Feb 26").length;

  const stats = [
    { label: "Tasks Completed", value: completedToday, change: "+2 from yesterday", icon: CheckCircle2 },
    { label: "Total Tasks", value: tasks.length, change: "+3 this week", icon: FileText },
    { label: "Score", value: "85%", change: "+5% from last week", icon: TrendingUp },
    { label: "Streak", value: "7 days", change: "Keep it up!", icon: Flame },
  ];

  const activityData = [
    { day: "Mon", completed: 8 },
    { day: "Tue", completed: 12 },
    { day: "Wed", completed: 6 },
    { day: "Thu", completed: 10 },
    { day: "Fri", completed: 9 },
    { day: "Sat", completed: 5 },
    { day: "Sun", completed: 3 },
  ];

  const priorityColors = {
    high: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400",
    medium: "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
    low: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back! Here's your productivity overview.</p>
      </div>

      {/* Quick Add */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 p-4">
        <h2 className="font-semibold mb-3">Quick Add Task</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="What do you need to do?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleAddTask}>
            <Plus className="size-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/20 dark:border-l-primary/35 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/15 dark:hover:border-primary/25 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                <Icon className="size-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Today's Tasks</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{todayTasks.filter(t => !t.completed).length} remaining</span>
          </div>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? "bg-primary border-primary"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary"
                  }`}
                >
                  {task.completed && <Check className="size-3 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${task.completed ? "line-through text-emerald-700 dark:text-emerald-400" : ""}`}>
                    {task.title}
                  </div>
                  {task.project && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{task.project}</div>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs ${priorityColors[task.priority ?? "low"]}`}>
                  {task.priority ?? "low"}
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreHorizontal className="size-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 p-4">
            <h2 className="font-semibold mb-4">Activity</h2>
            <div className="space-y-3">
              {activityData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">{item.day}</span>
                    <span className="font-medium">{item.completed} tasks</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(item.completed / 12) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 p-4">
            <h2 className="font-semibold mb-4">Upcoming</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarDays className="size-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Team Meeting</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tomorrow at 2:00 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="size-4 text-orange-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Project Deadline</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Friday at 5:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}