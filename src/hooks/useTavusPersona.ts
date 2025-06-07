
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TavusPersona {
  persona_id: string;
  persona_name: string;
  status: string;
}

interface ConversationData {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export const useTavusPersona = () => {
  const [persona, setPersona] = useState<TavusPersona | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersona = useCallback(async (personaId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: { 
          action: 'getPersona',
          personaId: personaId || 'p8494ff3054c'
        }
      });

      if (error) throw error;
      
      setPersona(data);
      console.log('Persona loaded:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load persona';
      setError(errorMessage);
      console.error('Error loading persona:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (personaId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: { 
          action: 'createConversation',
          personaId: personaId || 'p8494ff3054c'
        }
      });

      if (error) throw error;
      
      setConversation(data);
      console.log('Conversation created:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string, conversationId?: string) => {
    if (!conversationId && !conversation?.conversation_id) {
      throw new Error('No active conversation');
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('tavus-persona', {
        body: { 
          action: 'sendMessage',
          conversationData: {
            conversationId: conversationId || conversation?.conversation_id,
            message
          }
        }
      });

      if (error) throw error;
      
      console.log('Message sent to AI:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conversation]);

  return {
    persona,
    conversation,
    loading,
    error,
    getPersona,
    createConversation,
    sendMessage,
  };
};
