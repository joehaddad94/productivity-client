import { useState } from "react";
import { Plus, Search, Bold, Italic, List, ListOrdered, Tag, MoreVertical } from "lucide-react";
import type { Note } from "@/lib/types";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";

const initialNotes: Note[] = [
  {
    id: "1",
    title: "Product Roadmap Ideas",
    preview: "Q2 2026 features to consider: Enhanced analytics dashboard, mobile app improvements, integration with third-party tools...",
    tags: ["Planning", "Product"],
    lastEdited: "2 hours ago",
  },
  {
    id: "2",
    title: "Meeting Notes - Design Review",
    preview: "Discussed new UI components and design system updates. Action items: Update color palette, create new button variants...",
    tags: ["Meeting", "Design"],
    lastEdited: "Yesterday",
  },
  {
    id: "3",
    title: "Weekly Goals",
    preview: "Focus areas for this week: Complete feature implementation, write documentation, conduct user interviews...",
    tags: ["Goals"],
    lastEdited: "3 days ago",
  },
  {
    id: "4",
    title: "Research Notes - Tasky",
    preview: "Comparison of different productivity methodologies: GTD, Time Blocking, Pomodoro Technique. Key insights...",
    tags: ["Research"],
    lastEdited: "1 week ago",
  },
];

export function Notes() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteTitle, setNoteTitle] = useState(notes[0]?.title || "");
  const [noteContent, setNoteContent] = useState(notes[0]?.preview || "");

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.preview);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      preview: "",
      tags: [],
      lastEdited: "Just now",
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setNoteTitle(newNote.title);
    setNoteContent("");
    toast.success("New note created");
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col min-h-0">
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Notes List */}
        <div className="lg:w-72 space-y-3 flex flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Notes</h1>
            <Button size="sm" onClick={handleCreateNote}>
              <Plus className="size-3.5 mr-1.5" />
              New
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={selectedNote?.id === note.id}
                onSelect={handleSelectNote}
              />
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {selectedNote ? (
            <>
              {/* Toolbar */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Bold className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Italic className="size-3.5" />
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <Button variant="ghost" size="sm">
                      <List className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ListOrdered className="size-3.5" />
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <Button variant="ghost" size="sm">
                      <Tag className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm">
                      Convert to Task
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedNote.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <Tag className="size-2.5 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 text-[10px]">
                    <Plus className="size-2.5 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <Input
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="text-xl font-bold border-0 p-0 mb-3 focus-visible:ring-0"
                />
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Start writing..."
                  className="min-h-[320px] border-0 p-0 resize-none focus-visible:ring-0 text-sm"
                />
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Last edited {selectedNote.lastEdited}</span>
                  <span>{noteContent.length} characters</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a note to start editing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
