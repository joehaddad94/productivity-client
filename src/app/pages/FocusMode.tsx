import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { X, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Progress } from "@/app/components/ui/progress";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

const mockTask = {
  id: "1",
  title: "Prepare presentation for stakeholders",
  description: "Create a comprehensive presentation covering Q1 results and Q2 roadmap",
  subtasks: [
    { id: "1", title: "Gather Q1 performance data", completed: true },
    { id: "2", title: "Create slide deck structure", completed: true },
    { id: "3", title: "Design data visualizations", completed: false },
    { id: "4", title: "Write speaker notes", completed: false },
    { id: "5", title: "Review with team lead", completed: false },
  ] as Subtask[],
};

export function FocusMode() {
  const router = useRouter();
  const { taskId } = useParams();
  const [subtasks, setSubtasks] = useState<Subtask[]>(mockTask.subtasks);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isPomodoroMode) {
      toast.success("Pomodoro session complete! Take a break.");
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, isPomodoroMode]);

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    if (!isPomodoroMode) {
      setIsPomodoroMode(true);
    }
  };

  const handleResetTimer = () => {
    setTimerSeconds(25 * 60);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const completedSubtasks = subtasks.filter((t) => t.completed).length;
  const totalSubtasks = subtasks.length;
  const progress = (completedSubtasks / totalSubtasks) * 100;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-50 overflow-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <X className="size-5" />
            Exit Focus Mode
          </Button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {completedSubtasks} of {totalSubtasks} completed
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl space-y-12">
            {/* Task Title */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {mockTask.title}
              </h1>
              {mockTask.description && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {mockTask.description}
                </p>
              )}
              <Progress value={progress} className="h-2" />
            </div>

            {/* Pomodoro Timer */}
            {isPomodoroMode && (
              <div className="text-center space-y-6">
                <div className="inline-block p-12 bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-800">
                  <div className="text-7xl font-mono font-bold">
                    {formatTime(timerSeconds)}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleToggleTimer}
                    className="gap-2"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="size-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-5" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleResetTimer}
                    className="gap-2"
                  >
                    <RotateCcw className="size-5" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Start Pomodoro Button */}
            {!isPomodoroMode && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleToggleTimer}
                  className="gap-2"
                >
                  <Play className="size-5" />
                  Start Pomodoro (25:00)
                </Button>
              </div>
            )}

            {/* Subtasks */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Subtasks</h2>
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 transition-all hover:shadow-md"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                      className="size-6"
                    />
                    <span
                      className={`text-lg flex-1 ${
                        subtask.completed
                          ? "line-through text-gray-500 dark:text-gray-500"
                          : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                    {subtask.completed && (
                      <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
