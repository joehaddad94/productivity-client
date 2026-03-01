import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "@/app/components/TaskCard";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner";

const allTasks: Task[] = [
  {
    id: "1",
    title: "Review Q1 financial reports",
    completed: false,
    dueDate: "Feb 20",
    priority: "high",
    tags: ["Finance"],
    status: "In Progress",
    overdue: true,
  },
  {
    id: "2",
    title: "Prepare presentation for stakeholders",
    completed: false,
    dueDate: "Feb 26",
    priority: "high",
    tags: ["Meeting"],
    status: "To Do",
  },
  {
    id: "3",
    title: "Update project roadmap",
    completed: false,
    dueDate: "Feb 26",
    priority: "medium",
    tags: ["Planning"],
    status: "In Progress",
  },
  {
    id: "4",
    title: "Call with design team",
    completed: true,
    dueDate: "Feb 25",
    tags: ["Meeting"],
    status: "Done",
  },
  {
    id: "5",
    title: "Review pull requests",
    completed: false,
    dueDate: "Feb 27",
    priority: "medium",
    tags: ["Development"],
    status: "To Do",
  },
  {
    id: "6",
    title: "Write blog post about productivity",
    completed: false,
    dueDate: "Feb 28",
    tags: ["Content"],
    status: "To Do",
  },
  {
    id: "7",
    title: "Client feedback review",
    completed: true,
    dueDate: "Feb 24",
    priority: "high",
    tags: ["Client"],
    status: "Done",
  },
  {
    id: "8",
    title: "Update documentation",
    completed: false,
    dueDate: "Mar 1",
    priority: "low",
    tags: ["Development"],
    status: "To Do",
  },
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(allTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    toast.success("Task updated");
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayTasks = filteredTasks.filter((t) => t.dueDate === "Feb 26");
  const upcomingTasks = filteredTasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate !== "Feb 26"
  );
  const completedTasks = filteredTasks.filter((t) => t.completed);
  const priorityTasks = filteredTasks.filter((t) => t.priority === "high" && !t.completed);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your tasks and stay productive
              </p>
            </div>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="today">
                Today
                <Badge variant="secondary" className="ml-2">
                  {todayTasks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming
                <Badge variant="secondary" className="ml-2">
                  {upcomingTasks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                <Badge variant="secondary" className="ml-2">
                  {completedTasks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="priority">
                Priority
                <Badge variant="secondary" className="ml-2">
                  {priorityTasks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-2 mt-4">
              {todayTasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks due today
                </p>
              ) : (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onSelect={handleSelectTask}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-2 mt-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No upcoming tasks
                </p>
              ) : (
                upcomingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onSelect={handleSelectTask}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2 mt-4">
              {completedTasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No completed tasks
                </p>
              ) : (
                completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onSelect={handleSelectTask}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="priority" className="space-y-2 mt-4">
              {priorityTasks.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No priority tasks
                </p>
              ) : (
                priorityTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onSelect={handleSelectTask}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail Panel */}
        {showDetail && selectedTask && (
          <div className="lg:w-96 fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-0 bg-white dark:bg-gray-900 lg:bg-transparent">
            <Card className="h-full lg:sticky lg:top-6 border-0 lg:border rounded-none lg:rounded-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Task Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetail(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Title</Label>
                  <Input defaultValue={selectedTask.title} />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Select defaultValue={selectedTask.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Priority</Label>
                  <Select defaultValue={selectedTask.priority || "none"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Due Date</Label>
                  <Input type="text" defaultValue={selectedTask.dueDate} />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus className="size-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button className="flex-1">Save Changes</Button>
                  <Button variant="outline" className="flex-1">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
