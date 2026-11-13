SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000031"}',false);
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)
SELECT auth.uid(),public.rotamapa_current_portfolio(),'94000000-0000-4000-8000-000000000003','sale',(data-'manualBilling')||'{"id":"94000000-0000-4000-8000-000000000003"}'::jsonb FROM public.rotamapa_commerce_items WHERE id='53000000-0000-4000-8000-000000000003';
DO $$DECLARE old_data jsonb; revised jsonb; rev bigint; BEGIN
SELECT data,revision INTO old_data,rev FROM public.rotamapa_commerce_items WHERE id='94000000-0000-4000-8000-000000000003';
revised:=jsonb_set(jsonb_set(jsonb_set(old_data,'{lines,0,quantity}','6'),'{lines,0,totalCents}','12000'),'{totalCents}','12000');
revised:=revised||jsonb_build_object('editHistory',jsonb_build_array(jsonb_build_object('lines',old_data->'lines','totalCents',old_data->'totalCents','notes',coalesce(old_data->>'notes',''))));
UPDATE public.rotamapa_commerce_items SET data=revised,revision=rev+1 WHERE id='94000000-0000-4000-8000-000000000003';
PERFORM test.ensure((SELECT data->>'totalCents'='12000' AND data#>>'{editHistory,0,totalCents}'='10000' FROM public.rotamapa_commerce_items WHERE id='94000000-0000-4000-8000-000000000003'),'edit failed or original lost');
BEGIN UPDATE public.rotamapa_commerce_items SET data=jsonb_set(data,'{notes}','"bad history"'),revision=revision+1 WHERE id='94000000-0000-4000-8000-000000000003';RAISE EXCEPTION 'BAD_HISTORY_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='BAD_HISTORY_ALLOWED' THEN RAISE;END IF;END;
BEGIN UPDATE public.rotamapa_commerce_items SET data=jsonb_set(data,'{totalCents}','1'),revision=revision+1 WHERE id='53000000-0000-4000-8000-000000000003';RAISE EXCEPTION 'BILLED_EDIT_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='BILLED_EDIT_ALLOWED' THEN RAISE;END IF;END;
END $$;
RESET ROLE;
