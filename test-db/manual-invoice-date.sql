SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000031"}',false);
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)
 SELECT auth.uid(),public.rotamapa_current_portfolio(),'83000000-0000-4000-8000-000000000003','sale',(data-'manualBilling')||jsonb_build_object('id','83000000-0000-4000-8000-000000000003','manualBilling',jsonb_build_object('version',1,'state','invoiced','method','owner_confirmation','confirmedBy',auth.uid(),'confirmedAt',now(),'invoiceDate','2026-10-31','invoiceNumber','00123','totalCents',10000,'note','Conferido pelo titular')) FROM public.rotamapa_commerce_items WHERE user_id=auth.uid() AND portfolio_id=public.rotamapa_current_portfolio() AND id='53000000-0000-4000-8000-000000000003';
SELECT public.rotamapa_library_put(repeat('5',64),'snapshot',repeat('8',64),jsonb_build_object('ownerId',auth.uid(),'portfolioId',public.rotamapa_current_portfolio(),'companyId','EMPRESA TESTE','saleId','83000000-0000-4000-8000-000000000003','lineId','0','productId','43000000-0000-4000-8000-000000000003','date','2026-10-31','rule',(SELECT data->'entries'->0 FROM public.rotamapa_library_items WHERE id=repeat('8',64))));
SELECT test.ensure((SELECT data->>'date'='2026-10-31' FROM public.rotamapa_library_items WHERE id=repeat('5',64)),'actual invoice date selects the historical commission period');
DO $$DECLARE payload jsonb;BEGIN
 SELECT data INTO payload FROM public.rotamapa_commerce_items WHERE user_id=auth.uid() AND portfolio_id=public.rotamapa_current_portfolio() AND id='83000000-0000-4000-8000-000000000003';
 payload:=jsonb_set(payload,'{id}','"83000000-0000-4000-8000-000000000004"');payload:=jsonb_set(payload,'{manualBilling,invoiceDate}',to_jsonb((current_date+1)::text));
 BEGIN INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)VALUES(auth.uid(),public.rotamapa_current_portfolio(),(payload->>'id')::uuid,'sale',payload);RAISE EXCEPTION 'FUTURE_MANUAL_INVOICE_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='FUTURE_MANUAL_INVOICE_ALLOWED' THEN RAISE;END IF;END;
END$$;
RESET ROLE;
SELECT 'Manual invoice date, immutable values and historical commission-period assertions passed' AS result;
