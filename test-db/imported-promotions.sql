-- Synthetic-only end-to-end import -> campaign -> saved sale; every original guard remains enabled.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000031"}',false);
CREATE TEMP TABLE promotion_fixture AS SELECT jsonb_build_array(
 jsonb_build_object('productId','43000000-0000-4000-8000-000000000003','validFrom','2026-11-05','validTo','2026-11-20','minimum',6,'priceCents',1500,'discountBps',null,'region','São Gonçalo','startTime','09:00','endTime','10:00','stock','30','restrictions',''),
 jsonb_build_object('productId','43000000-0000-4000-8000-000000000003','validFrom','2026-11-05','validTo','2026-11-20','minimum',12,'priceCents',1200,'discountBps',null,'region','São Gonçalo','startTime','09:00','endTime','10:00','stock','30','restrictions','')
) AS entries;
SELECT public.rotamapa_library_put(repeat('0',64),'campaigns',repeat('d',64),jsonb_build_object('format','csv','fileName','campanha.csv','company','Empresa teste','entries',(SELECT entries FROM promotion_fixture)));
CREATE TEMP TABLE imported_campaign_fixture AS SELECT jsonb_build_object('id','63000000-0000-4000-8000-000000000003','kind','campaign','type','importada','productId','43000000-0000-4000-8000-000000000003','name','Campanha sintética','startDate','2026-11-05','endDate','2026-11-20','tiers','[]'::jsonb,'imported',jsonb_build_object('version',1,'documentId',repeat('0',64),'sourceHash',repeat('d',64),'entries',entries)) AS data FROM promotion_fixture;
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) SELECT auth.uid(),public.rotamapa_current_portfolio(),(data->>'id')::uuid,'campaign',data FROM imported_campaign_fixture;
CREATE TEMP TABLE imported_sale_fixture AS SELECT jsonb_build_object('id','73000000-0000-4000-8000-000000000003','kind','sale','clientId','synthetic','date','2026-11-10','status','confirmed','totalCents',9000,'lines',jsonb_build_array(jsonb_build_object('productId','43000000-0000-4000-8000-000000000003','name','Produto sintético','code','TEST','quantity',6,'tableUnitCents',2000,'label','Campanha importada','minQty',6,'discountBps',2500,'unitPriceCents',1500,'unitCents',1500,'totalCents',9000,'campaign',data,'promotionContext',jsonb_build_object('region','sao goncalo','time','09:30')))) AS data FROM imported_campaign_fixture;
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) SELECT auth.uid(),public.rotamapa_current_portfolio(),(data->>'id')::uuid,'sale',data FROM imported_sale_fixture;
SELECT test.ensure((SELECT (data->>'totalCents')::int=9000 FROM public.rotamapa_commerce_items WHERE id='73000000-0000-4000-8000-000000000003'),'imported campaign reaches the saved order');
DO $$DECLARE value jsonb;BEGIN
 SELECT data INTO value FROM imported_sale_fixture;
 value:=jsonb_set(value,'{id}','"73000000-0000-4000-8000-000000000004"');value:=jsonb_set(value,'{lines,0,promotionContext,region}','"OUTRA REGIAO"');
 BEGIN INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)VALUES(auth.uid(),public.rotamapa_current_portfolio(),(value->>'id')::uuid,'sale',value);RAISE EXCEPTION 'WRONG_REGION_DISCOUNT';EXCEPTION WHEN OTHERS THEN IF sqlerrm='WRONG_REGION_DISCOUNT' THEN RAISE;END IF;END;
 SELECT data INTO value FROM imported_campaign_fixture;value:=jsonb_set(value,'{id}','"63000000-0000-4000-8000-000000000004"');value:=jsonb_set(value,'{imported,entries}',jsonb_build_array(value#>'{imported,entries,0}'));
 BEGIN INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)VALUES(auth.uid(),public.rotamapa_current_portfolio(),(value->>'id')::uuid,'campaign',value);RAISE EXCEPTION 'OMITTED_TIER_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='OMITTED_TIER_ALLOWED' THEN RAISE;END IF;END;
 SELECT data INTO value FROM imported_campaign_fixture;value:=jsonb_set(value,'{id}','"63000000-0000-4000-8000-000000000004"');value:=jsonb_set(value,'{imported,entries,0,priceCents}','1');
 BEGIN INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)VALUES(auth.uid(),public.rotamapa_current_portfolio(),(value->>'id')::uuid,'campaign',value);RAISE EXCEPTION 'ALTERED_ORIGINAL_ALLOWED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='ALTERED_ORIGINAL_ALLOWED' THEN RAISE;END IF;END;
END$$;
SELECT test.ensure((rotamapa_private.imported_campaign_line('{"priceCents":2000}',12,(SELECT data FROM imported_campaign_fixture),'2026-11-10','{"region":"SAO GONCALO","time":"09:30"}')->>'unitCents')::int=1200,'highest reached tier');
SELECT test.ensure((rotamapa_private.imported_campaign_line('{"priceCents":2000}',31,(SELECT data FROM imported_campaign_fixture),'2026-11-10','{"region":"SAO GONCALO","time":"09:30"}')->>'unitCents')::int=2000,'stock restriction enforced');
SELECT test.ensure((rotamapa_private.imported_campaign_line('{"priceCents":2000}',6,(SELECT data FROM imported_campaign_fixture),'2026-12-10','{"region":"SAO GONCALO","time":"09:30"}')->>'unitCents')::int=2000,'expired campaign uses table price');
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000032"}',false);
DO $$BEGIN
 BEGIN INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data)SELECT auth.uid(),public.rotamapa_current_portfolio(),(data->>'id')::uuid,'campaign',data FROM imported_campaign_fixture;RAISE EXCEPTION 'FOREIGN_PORTFOLIO_SOURCE';EXCEPTION WHEN OTHERS THEN IF sqlerrm='FOREIGN_PORTFOLIO_SOURCE' THEN RAISE;END IF;END;
END$$;
RESET ROLE;
SELECT 'Imported campaign saved-sale, source, region, tier, expiry, stock and portfolio assertions passed' AS result;
