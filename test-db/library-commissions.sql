-- Actual server-side invoice/rule checks, using synthetic records only.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000031"}',false);
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) VALUES(auth.uid(),public.rotamapa_current_portfolio(),'43000000-0000-4000-8000-000000000003','product','{"id":"43000000-0000-4000-8000-000000000003","kind":"product","name":"Produto sintético","priceCents":2000,"code":"TEST"}');
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) VALUES(auth.uid(),public.rotamapa_current_portfolio(),'53000000-0000-4000-8000-000000000003','sale','{"id":"53000000-0000-4000-8000-000000000003","kind":"sale","clientId":"synthetic","date":"2026-11-02","status":"confirmed","totalCents":10000,"lines":[{"productId":"43000000-0000-4000-8000-000000000003","name":"Produto sintético","code":"TEST","quantity":5,"tableUnitCents":2000,"label":"Preço de tabela","minQty":0,"discountBps":0,"unitCents":2000,"totalCents":10000,"campaign":null}]}');
SELECT public.rotamapa_library_put(repeat('8',64),'commissions',repeat('8',64),jsonb_build_object('format','csv','fileName','comissao.csv','entries',jsonb_build_array(jsonb_build_object('ownerId',auth.uid(),'portfolioId',public.rotamapa_current_portfolio(),'companyId','EMPRESA TESTE','productId','43000000-0000-4000-8000-000000000003','rateBps',900,'validFrom','2026-01-01','validTo','2026-12-31'))));
CREATE TEMP TABLE snapshot_fixture AS SELECT jsonb_build_object('ownerId',auth.uid(),'portfolioId',public.rotamapa_current_portfolio(),'companyId','EMPRESA TESTE','saleId','53000000-0000-4000-8000-000000000003','lineId','0','productId','43000000-0000-4000-8000-000000000003','date','2026-11-02','rule',data#>'{entries,0}') AS data FROM public.rotamapa_library_items WHERE id=repeat('8',64);
DO $$BEGIN BEGIN PERFORM public.rotamapa_library_put(repeat('9',64),'snapshot',repeat('8',64),(SELECT data FROM snapshot_fixture));RAISE EXCEPTION 'UNBILLED_SNAPSHOT_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='UNBILLED_SNAPSHOT_ALLOWED' THEN RAISE;END IF;END;END$$;
UPDATE public.rotamapa_commerce_items SET data=data||'{"manualBilling":{"version":1,"state":"invoiced","method":"owner_confirmation","confirmedBy":"00000000-0000-4000-8000-000000000003","confirmedAt":"2026-11-02T12:00:00Z","totalCents":10000,"note":"Fatura sintética"}}',revision=revision+1 WHERE id='53000000-0000-4000-8000-000000000003';
SELECT public.rotamapa_library_put(repeat('9',64),'snapshot',repeat('8',64),(SELECT data FROM snapshot_fixture));
DO $$BEGIN
 BEGIN PERFORM public.rotamapa_library_put(repeat('7',64),'snapshot',repeat('8',64),(SELECT jsonb_set(data,'{rule,rateBps}','600') FROM snapshot_fixture));RAISE EXCEPTION 'UNVERIFIED_RATE_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='UNVERIFIED_RATE_ALLOWED' THEN RAISE;END IF;END;
 BEGIN PERFORM public.rotamapa_library_put(repeat('9',64),'snapshot',repeat('8',64),(SELECT jsonb_set(data,'{rule,rateBps}','600') FROM snapshot_fixture));RAISE EXCEPTION 'HISTORIC_RATE_CHANGED';EXCEPTION WHEN serialization_failure THEN NULL;END;
END$$;
SELECT test.ensure((SELECT data#>>'{rule,rateBps}'='900' FROM public.rotamapa_library_items WHERE id=repeat('9',64)),'historic invoice rate preserved');
RESET ROLE;
SELECT 'Commission snapshot invoice, source rule and immutability assertions passed' AS result;
