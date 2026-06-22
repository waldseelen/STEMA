-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    raw_response JSONB,
    token_cost NUMERIC(10, 6) DEFAULT 0.0,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Concepts table
CREATE TABLE IF NOT EXISTS public.concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    prerequisite_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Concept Mastery table
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    confidence_interval NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, concept_id)
);

-- Error Logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL CHECK (error_type IN ('conceptual', 'procedural', 'calculation', 'strategic', 'unknown')),
    raw_user_answer TEXT,
    model_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Spaced Repetition Cards (FSRS) table
CREATE TABLE IF NOT EXISTS public.sr_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    stability NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
    retrievability NUMERIC(5, 4) NOT NULL DEFAULT 1.0,
    state INTEGER NOT NULL DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_review TIMESTAMP WITH TIME ZONE,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Document Chunks table (with pgvector embedding)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- 1536 for OpenAI text-embedding-3-small
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mindmaps table
CREATE TABLE IF NOT EXISTS public.mindmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tutor Events table
CREATE TABLE IF NOT EXISTS public.tutor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Sessions policies
CREATE POLICY "Users can manage their own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can manage their own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

-- Concepts policies (read-only for all users, write-restricted)
CREATE POLICY "Anyone can read concepts" ON public.concepts
    FOR SELECT USING (true);

-- Concept Mastery policies
CREATE POLICY "Users can manage their own concept mastery" ON public.concept_mastery
    FOR ALL USING (auth.uid() = user_id);

-- Error Logs policies
CREATE POLICY "Users can manage their own error logs" ON public.error_logs
    FOR ALL USING (auth.uid() = user_id);

-- SR Cards policies
CREATE POLICY "Users can manage their own spaced repetition cards" ON public.sr_cards
    FOR ALL USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can manage their own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

-- Document Chunks policies (Users can read/manage chunks of documents they own)
CREATE POLICY "Users can manage chunks of their own documents" ON public.document_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = auth.uid()
        )
    );

-- Mindmaps policies
CREATE POLICY "Users can manage their own mindmaps" ON public.mindmaps
    FOR ALL USING (auth.uid() = user_id);

-- Tutor Events policies
CREATE POLICY "Users can manage their own tutor events" ON public.tutor_events
    FOR ALL USING (auth.uid() = user_id);

-- Seed default concepts with prerequisite relationships
-- Clear existing ones to prevent duplicates (since code is UNIQUE)
TRUNCATE public.concepts CASCADE;

DO $$
DECLARE
    math101_id UUID;
    math102_id UUID;
    math103_id UUID;
    math104_id UUID;
    phys101_id UUID;
    phys102_id UUID;
    phys103_id UUID;
    eee201_id UUID;
BEGIN
    -- MATH101: Limit ve Süreklilik
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('MATH101', 'Limit ve Süreklilik', 'Limit kavramı, limit alma kuralları, süreklilik tanımı ve sandviç teoremi.', NULL)
    RETURNING id INTO math101_id;

    -- MATH102: Türev ve Uygulamaları (Prereq: MATH101)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('MATH102', 'Türev ve Uygulamaları', 'Türev tanımı, türev alma kuralları, zincir kuralı, maksimum/minimum problemleri ve grafik çizimi.', math101_id)
    RETURNING id INTO math102_id;

    -- MATH103: İntegral ve Alan Hesabı (Prereq: MATH102)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('MATH103', 'İntegral ve Alan Hesabı', 'Belirsiz integral, belirli integral, Riemann toplamları ve integral yardımıyla alan/hacim hesaplama.', math102_id)
    RETURNING id INTO math103_id;

    -- MATH104: Kısmi İntegrasyon (Prereq: MATH103)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('MATH104', 'Kısmi İntegrasyon', 'Kısmi integral formülü, değişken değiştirme ile karmaşık integral çözümleri ve integral teknikleri.', math103_id)
    RETURNING id INTO math104_id;

    -- PHYS101: Newton''ın Hareket Yasaları (Prereq: MATH102)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('PHYS101', 'Newton''ın Hareket Yasaları', 'Kuvvet, kütle, ivme, serbest cisim diyagramları, statik ve kinetik sürtünme kuvvetleri.', math102_id)
    RETURNING id INTO phys101_id;

    -- PHYS102: İş ve Enerji Teoremi (Prereq: PHYS101)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('PHYS102', 'İş ve Enerji Teoremi', 'İş tanımı, kinetik enerji, potansiyel enerji, mekanik enerjinin korunumu ve korunumsuz kuvvetlerin işi.', phys101_id)
    RETURNING id INTO phys102_id;

    -- PHYS103: Elektriksel Potansiyel ve Güç (Prereq: PHYS102)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('PHYS103', 'Elektriksel Potansiyel ve Güç', 'Elektriksel alan, elektriksel potansiyel farkı, iş, güç ve elektrik potansiyel enerjisi.', phys102_id)
    RETURNING id INTO phys103_id;

    -- EEE201: Devre Analizi ve Kirchhoff Yasaları (Prereq: PHYS103)
    INSERT INTO public.concepts (code, name, description, prerequisite_id)
    VALUES ('EEE201', 'Devre Analizi ve Kirchhoff Yasaları', 'Kirchhoff Akım Yasası (KCL), Kirchhoff Voltaj Yasası (KVL), düğüm gerilimleri yöntemi ve çevre akımları yöntemi.', phys103_id)
    RETURNING id INTO eee201_id;
END $$;
