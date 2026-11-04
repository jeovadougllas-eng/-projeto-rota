-- Mirror the already-existing hosted customer columns in disposable fixtures only.
ALTER TABLE public.clients ADD COLUMN cnpj text, ADD COLUMN city text, ADD COLUMN neighborhood text, ADD COLUMN address text, ADD COLUMN zip_code text, ADD COLUMN latitude double precision, ADD COLUMN longitude double precision, ADD COLUMN created_at timestamptz DEFAULT now(), ADD COLUMN updated_at timestamptz DEFAULT now();
CREATE FUNCTION public.traxio_clients_before_update() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$BEGIN NEW.updated_at=now();NEW.revision=OLD.revision+1;RETURN NEW;END;$$;
CREATE TRIGGER traxio_clients_update_trigger BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.traxio_clients_before_update();
