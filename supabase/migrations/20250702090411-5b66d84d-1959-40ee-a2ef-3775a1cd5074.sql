-- Create transcriptions table for storing debate transcripts
CREATE TABLE public.transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  speaker_type TEXT NOT NULL CHECK (speaker_type IN ('user', 'opponent')),
  content TEXT NOT NULL,
  timestamp_start NUMERIC NOT NULL,
  timestamp_end NUMERIC,
  confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debate_analysis table for storing AI feedback
CREATE TABLE public.debate_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('live_feedback', 'final_suggestions')),
  content TEXT NOT NULL,
  metrics JSON,
  suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for transcriptions
CREATE POLICY "Users can view transcriptions from their debates" 
ON public.transcriptions 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.active_debates 
    WHERE id = debate_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can create their own transcriptions" 
ON public.transcriptions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transcriptions" 
ON public.transcriptions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create policies for debate analysis
CREATE POLICY "Users can view analysis from their debates" 
ON public.debate_analysis 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.active_debates 
    WHERE id = debate_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can create their own analysis" 
ON public.debate_analysis 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_transcriptions_debate_id ON public.transcriptions(debate_id);
CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX idx_transcriptions_timestamp ON public.transcriptions(timestamp_start);
CREATE INDEX idx_debate_analysis_debate_id ON public.debate_analysis(debate_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transcriptions_updated_at
BEFORE UPDATE ON public.transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live transcription updates
ALTER TABLE public.transcriptions REPLICA IDENTITY FULL;
ALTER TABLE public.debate_analysis REPLICA IDENTITY FULL;