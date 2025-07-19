import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotes, type Note } from '@/hooks/useNotes';
import { 
  StickyNote, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  FileText 
} from 'lucide-react';

interface NotePadProps {
  debateId?: string;
  className?: string;
}

export const NotePad: React.FC<NotePadProps> = ({ debateId, className }) => {
  const { notes, isLoading, isSaving, createNote, updateNote, deleteNote } = useNotes(debateId);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreateNote = async () => {
    const newNote = await createNote();
    if (newNote) {
      setSelectedNote(newNote);
      setIsEditing(true);
      setEditTitle(newNote.title);
      setEditContent(newNote.content);
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveNote = async () => {
    if (selectedNote) {
      const success = await updateNote(selectedNote.id, {
        title: editTitle || 'Untitled Note',
        content: editContent,
      });
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success && selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    if (!isEditing) {
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (isEditing && selectedNote) {
      const autoSaveTimer = setTimeout(() => {
        if (editTitle !== selectedNote.title || editContent !== selectedNote.content) {
          updateNote(selectedNote.id, {
            title: editTitle || 'Untitled Note',
            content: editContent,
          });
        }
      }, 2000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [editTitle, editContent, isEditing, selectedNote, updateNote]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            Notes
            {debateId && <Badge variant="secondary" className="text-xs">Debate Notes</Badge>}
          </CardTitle>
          <Button 
            onClick={handleCreateNote}
            disabled={isLoading || isSaving}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[400px]">
          {/* Notes List */}
          <div className="w-1/3 border-r">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading notes...</div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No notes yet</div>
                    <div className="text-xs text-muted-foreground mt-1">Click + to create one</div>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedNote?.id === note.id ? 'bg-muted border-primary' : ''
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{note.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {note.content || 'Empty note'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Note Editor */}
          <div className="flex-1 flex flex-col">
            {selectedNote ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Note title..."
                        className="font-medium"
                      />
                    ) : (
                      <div className="font-medium">{selectedNote.title}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={handleSaveNote}
                          disabled={isSaving}
                          size="sm"
                          variant="default"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={() => handleEditNote(selectedNote)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteNote(selectedNote.id)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Start writing your notes..."
                      className="h-full resize-none border-none shadow-none focus-visible:ring-0"
                    />
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="whitespace-pre-wrap text-sm">
                        {selectedNote.content || (
                          <div className="text-muted-foreground italic">
                            This note is empty. Click edit to add content.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">
                    Select a note to view or edit
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};