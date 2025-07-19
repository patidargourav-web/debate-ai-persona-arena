import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  user_id: string;
  debate_id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = (debateId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (debateId) {
        query = query.eq('debate_id', debateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (title: string = 'Untitled Note', content: string = '') => {
    if (!user) return null;

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          debate_id: debateId,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    if (!user) return false;

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, ...data } : note
      ));
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user, debateId]);

  return {
    notes,
    isLoading,
    isSaving,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};