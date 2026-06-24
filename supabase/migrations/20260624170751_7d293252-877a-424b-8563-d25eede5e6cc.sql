ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS documents_sort_order_idx ON public.documents(sort_order);