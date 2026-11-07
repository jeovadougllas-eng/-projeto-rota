-- Explicit owner-confirmed manual invoices. Original sale amounts and items remain immutable.
BEGIN;
CREATE OR REPLACE FUNCTION rotamapa_private.validate_commerce()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE d jsonb:=new.data; t jsonb; l jsonb; p jsonb; c jsonb; qty bigint; base bigint; bps integer; unit_price bigint; line_total bigint; total bigint:=0; prior_qty bigint:=0; prior_bps integer:=-1; chosen_min bigint; chosen_label text; count_lines integer; ids text[]:='{}'; offered_unit bigint; prior_unit bigint; direct_mode boolean;
BEGIN
 IF new.kind='sale' AND (new.data ? 'manualBilling' OR (TG_OP='UPDATE' AND old.data ? 'manualBilling')) THEN
  DECLARE b jsonb:=new.data->'manualBilling'; amount bigint;
  BEGIN
   IF new.data ? 'source' OR jsonb_typeof(b) IS DISTINCT FROM 'object' OR b->'version' IS DISTINCT FROM '1'::jsonb OR b->>'state' IS DISTINCT FROM 'invoiced' OR b->>'method' IS DISTINCT FROM 'owner_confirmation' OR b->>'confirmedBy' IS DISTINCT FROM new.user_id::text OR jsonb_typeof(b->'totalCents') IS DISTINCT FROM 'number' OR b->>'totalCents' IS DISTINCT FROM new.data->>'totalCents' OR coalesce(b->>'note','')='' THEN RAISE EXCEPTION 'Confirmação manual de faturamento inválida.'; END IF;
   IF auth.uid() IS DISTINCT FROM new.user_id AND NOT(current_user='postgres' AND auth.uid() IS NULL AND current_setting('role',true)='none') THEN RAISE EXCEPTION 'Confirme o faturamento somente na sua conta.' USING ERRCODE='42501'; END IF;
   IF coalesce(b->>'confirmedAt','')='' OR (b->>'confirmedAt')::timestamptz>clock_timestamp()+interval '1 minute' THEN RAISE EXCEPTION 'Data de confirmação inválida.'; END IF;
   IF TG_OP='UPDATE' AND old.data ? 'manualBilling' AND b IS DISTINCT FROM old.data->'manualBilling' THEN RAISE EXCEPTION 'Preserve a confirmação já registrada.'; END IF;
   IF jsonb_typeof(new.data->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(new.data->'lines')=0 THEN RAISE EXCEPTION 'Confira os itens faturados.'; END IF;
   SELECT sum((v->>'quantity')::bigint*(v->>'unitCents')::bigint) INTO amount FROM jsonb_array_elements(new.data->'lines') v;
   IF amount IS NULL OR amount<1 OR b->>'totalCents' IS DISTINCT FROM amount::text THEN RAISE EXCEPTION 'A confirmação deve preservar o valor dos itens.'; END IF;
  END;
 END IF;
 IF new.kind='sale' AND new.data#>'{source,version}'='2'::jsonb THEN
 DECLARE src jsonb:=new.data->'source'; r jsonb; item jsonb; line jsonb; prod jsonb; settlement_value jsonb; old_value jsonb; sub jsonb; pdf_item jsonb; seen text[]:='{}'; refs text[]:='{}'; hashes text[]:='{}'; settled text[]:='{}'; source_refs text[]:='{}'; first_cnpj text; total bigint:=0; count_items integer:=0; ri integer; ii integer; k integer; qty bigint; price bigint; base bigint; bps bigint; amount bigint; changed boolean:=TG_OP='INSERT' OR old.data#>'{source,version}' IS DISTINCT FROM '2'::jsonb; pending boolean:=false; exists_pdf boolean;
 BEGIN
  IF auth.uid() IS DISTINCT FROM new.user_id OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR new.portfolio_id IS DISTINCT FROM public.rotamapa_current_portfolio() THEN RAISE EXCEPTION 'Conta ou carteira inválida.' USING ERRCODE='42501'; END IF;
  IF TG_OP='INSERT' AND new.revision<>1 THEN RAISE EXCEPTION 'Revisão inicial inválida.'; END IF;
  IF TG_OP='UPDATE' THEN
   IF new.user_id<>old.user_id OR new.id<>old.id OR new.portfolio_id<>old.portfolio_id OR new.kind<>old.kind OR new.revision<>old.revision+1 THEN RAISE EXCEPTION 'Registro mudou. Sincronize e reabra.' USING ERRCODE='40001'; END IF;
   IF old.data->>'status' IN ('confirmed','cancelled') THEN
    IF old.data#>'{source,version}' IS DISTINCT FROM '2'::jsonb OR (new.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) THEN RAISE EXCEPTION 'Os dados originais do pedido devem ser preservados.'; END IF;
    IF old.data->>'status'='cancelled' AND (new.data-ARRAY['updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['updatedAt','version']) THEN RAISE EXCEPTION 'Este pedido já foi cancelado.'; END IF;
   ELSIF new.data->>'clientId' IS DISTINCT FROM old.data->>'clientId' OR new.data->>'visitId' IS DISTINCT FROM old.data->>'visitId' THEN RAISE EXCEPTION 'Cliente e visita devem ser preservados.'; END IF;
  END IF;
  IF src->>'type' IS DISTINCT FROM 'mercado_farma_pdf' OR src->'reviewed' IS DISTINCT FROM 'true'::jsonb OR coalesce(new.data->>'status','') NOT IN ('confirmed','cancelled') OR (changed AND new.data->>'status'<>'confirmed') OR coalesce(length(new.data->>'clientId'),0) NOT BETWEEN 1 AND 250 OR coalesce(new.data->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RAISE EXCEPTION 'Dados do pedido inválidos.'; END IF;
  PERFORM (new.data->>'date')::date;
  IF (new.data->>'date')::date>(now() AT TIME ZONE 'America/Fortaleza')::date THEN RAISE EXCEPTION 'A data do pedido não pode estar no futuro.'; END IF;
  IF new.data->>'status'='cancelled' AND coalesce(length(btrim(new.data->>'cancelReason')),0)=0 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento.'; END IF;
  IF changed THEN
   IF (public.traxelo_plan_access()->>'plan')='free' THEN RAISE EXCEPTION 'Importação de PDF disponível a partir do Plus.' USING ERRCODE='42501'; END IF;
   new.data:=jsonb_set(new.data,'{registeredAt}',to_jsonb(clock_timestamp()));
   IF coalesce(new.data->'settlements','[]'::jsonb)<>'[]'::jsonb THEN RAISE EXCEPTION 'Confirme o faturamento após registrar o pedido.'; END IF;
  END IF;
  PERFORM (new.data->>'registeredAt')::timestamptz;
  IF changed AND nullif(new.data->>'visitId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.traxelo_visit_events WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND id::text=new.data->>'visitId' AND client_id=new.data->>'clientId' AND status='confirmed') THEN RAISE EXCEPTION 'Confirme e sincronize a visita antes de enviar a venda.'; END IF;
  IF jsonb_typeof(src->'receipts') IS DISTINCT FROM 'array' OR jsonb_array_length(src->'receipts') NOT BETWEEN 1 AND 2 OR jsonb_typeof(new.data->'lines') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Confira os PDFs e os itens.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(new.user_id::text||':'||new.portfolio_id::text||':invoice_pdf',0));
  FOR r IN SELECT value FROM jsonb_array_elements(src->'receipts') LOOP
   PERFORM rotamapa_private.check_order_receipt(r);pending:=pending OR r->>'stage'='pending';
   IF first_cnpj IS NOT NULL AND r->>'cnpj'<>first_cnpj THEN RAISE EXCEPTION 'Os PDFs pertencem a clientes diferentes.'; END IF;first_cnpj:=r->>'cnpj';
   IF (r->>'orderNumber')=ANY(refs) OR (r->>'sha256')=ANY(hashes) THEN RAISE EXCEPTION 'O pedido foi selecionado duas vezes.'; END IF;refs:=array_append(refs,r->>'orderNumber');hashes:=array_append(hashes,r->>'sha256');
   IF EXISTS(SELECT 1 FROM public.rotamapa_commerce_items x CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x.data#>'{source,receipts}')='array' THEN x.data#>'{source,receipts}' ELSE '[]'::jsonb END) prior WHERE x.user_id=new.user_id AND x.portfolio_id=new.portfolio_id AND x.kind='sale' AND x.id<>new.id AND x.data->>'status'='confirmed' AND (prior->>'sha256'=r->>'sha256' OR (prior->>'provider'=r->>'provider' AND prior->>'orderNumber'=r->>'orderNumber'))) THEN RAISE EXCEPTION 'Um destes pedidos já está registrado nesta carteira.' USING ERRCODE='23505'; END IF;
   total:=total+(r->>'totalCents')::bigint;count_items:=count_items+jsonb_array_length(r->'items');
  END LOOP;
  IF NOT pending OR count_items NOT BETWEEN 1 AND 100 OR count_items<>jsonb_array_length(new.data->'lines') OR total>9000000000000 OR new.data->>'totalCents' IS DISTINCT FROM total::text THEN RAISE EXCEPTION 'Confira a soma e a situação dos PDFs.'; END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(new.data->'lines') LOOP
   IF coalesce(line->>'sourceReceipt','') !~ '^[0-9]+$' OR coalesce(line->>'sourceItem','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Item sem origem.'; END IF;ri:=(line->>'sourceReceipt')::integer;ii:=(line->>'sourceItem')::integer;
   IF ri NOT BETWEEN 0 AND jsonb_array_length(src->'receipts')-1 OR ii<0 OR (ri::text||':'||ii::text)=ANY(source_refs) THEN RAISE EXCEPTION 'Origem de item inválida ou repetida.'; END IF;
   r:=src->'receipts'->ri;IF ii>=jsonb_array_length(r->'items') THEN RAISE EXCEPTION 'Item não encontrado no PDF.'; END IF;item:=r->'items'->ii;source_refs:=array_append(source_refs,ri::text||':'||ii::text);
   IF changed THEN
    SELECT data INTO prod FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='product' AND id::text=line->>'productId';
    IF prod IS NULL OR coalesce((prod->>'disabled')::boolean,false) OR line->>'name' IS DISTINCT FROM prod->>'name' OR line->>'tableUnitCents' IS DISTINCT FROM prod->>'priceCents' THEN RAISE EXCEPTION 'Confira o catálogo desta carteira.'; END IF;
   END IF;
   IF coalesce(line->>'tableUnitCents','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Preço de tabela inválido.'; END IF;base:=(line->>'tableUnitCents')::bigint;IF base NOT BETWEEN 1 AND 1000000000 THEN RAISE EXCEPTION 'Preço de tabela inválido.'; END IF;price:=(item->>'unitCents')::bigint;bps:=greatest(0,((base-price)*10000+base/2)/base);
   IF line->>'quantity' IS DISTINCT FROM item->>'quantity' OR line->>'unitCents' IS DISTINCT FROM item->>'unitCents' OR line->>'totalCents' IS DISTINCT FROM item->>'totalCents' OR line->>'label' IS DISTINCT FROM (CASE WHEN r->>'stage'='pending' THEN 'Preço provisório no PDF' ELSE 'Preço faturado no PDF' END) OR line->>'minQty' IS DISTINCT FROM '0' OR line->>'discountBps' IS DISTINCT FROM bps::text OR line->'campaign' IS DISTINCT FROM 'null'::jsonb OR line ? 'unitPriceCents' THEN RAISE EXCEPTION 'Os itens divergem do PDF.'; END IF;
  END LOOP;
  IF jsonb_typeof(coalesce(new.data->'settlements','[]'::jsonb)) IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(new.data->'settlements','[]'::jsonb))>2 THEN RAISE EXCEPTION 'Confirmações inválidas.'; END IF;
  FOR old_value IN SELECT value FROM jsonb_array_elements(coalesce(old.data->'settlements','[]'::jsonb)) LOOP
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(new.data->'settlements') v WHERE v=old_value) THEN RAISE EXCEPTION 'Uma confirmação já registrada deve ser preservada.'; END IF;
  END LOOP;
  FOR settlement_value IN SELECT value FROM jsonb_array_elements(coalesce(new.data->'settlements','[]'::jsonb)) LOOP
   IF coalesce(settlement_value->>'receipt','') !~ '^[0-9]+$' OR (settlement_value->>'receipt')=ANY(settled) OR coalesce(settlement_value->>'state','') NOT IN ('invoiced','cancelled') OR coalesce(settlement_value->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR settlement_value->>'note' IS NULL OR length(settlement_value->>'note')>1000 OR coalesce(settlement_value->>'invoiceNumber','') !~ '^[0-9]{0,30}$' THEN RAISE EXCEPTION 'Confirmação inválida.'; END IF;
   ri:=(settlement_value->>'receipt')::integer;IF ri NOT BETWEEN 0 AND jsonb_array_length(src->'receipts')-1 THEN RAISE EXCEPTION 'Pedido de origem inválido.'; END IF;r:=src->'receipts'->ri;IF r->>'stage'<>'pending' THEN RAISE EXCEPTION 'O pedido original já estava faturado.'; END IF;
   IF (settlement_value->>'date')::date>(now() AT TIME ZONE 'America/Fortaleza')::date THEN RAISE EXCEPTION 'A data do faturamento não pode estar no futuro.'; END IF;settled:=array_append(settled,settlement_value->>'receipt');
   IF jsonb_typeof(settlement_value->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Confira os itens faturados.'; END IF;
   IF settlement_value->>'state'='cancelled' THEN
    IF coalesce(length(btrim(settlement_value->>'note')),0)=0 OR jsonb_array_length(settlement_value->'items')<>0 OR settlement_value->>'totalCents' IS DISTINCT FROM '0' THEN RAISE EXCEPTION 'Informe o motivo do cancelamento.'; END IF;
   ELSE
    IF jsonb_array_length(settlement_value->'items')<>jsonb_array_length(r->'items') THEN RAISE EXCEPTION 'Confira todas as apresentações.'; END IF;amount:=0;k:=0;
    IF settlement_value ? 'pdf' THEN PERFORM rotamapa_private.check_order_receipt(settlement_value->'pdf');IF settlement_value#>>'{pdf,stage}'<>'invoiced' OR settlement_value#>>'{pdf,orderNumber}'<>r->>'orderNumber' OR settlement_value#>>'{pdf,cnpj}'<>r->>'cnpj' THEN RAISE EXCEPTION 'O PDF atualizado não corresponde ao pedido.'; END IF; END IF;
    FOR sub IN SELECT value FROM jsonb_array_elements(settlement_value->'items') LOOP
     IF sub->>'sourceItem' IS DISTINCT FROM k::text OR coalesce(sub->>'quantity','') !~ '^[0-9]+$' OR coalesce(sub->>'unitCents','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Item faturado inválido.'; END IF;qty:=(sub->>'quantity')::bigint;price:=(sub->>'unitCents')::bigint;IF qty NOT BETWEEN 0 AND 1000000 OR price NOT BETWEEN 0 AND 1000000000 THEN RAISE EXCEPTION 'Confira quantidades e preços faturados.'; END IF;amount:=amount+qty*price;
     IF settlement_value ? 'pdf' AND qty>0 THEN SELECT p INTO pdf_item FROM jsonb_array_elements(settlement_value#>'{pdf,items}') p WHERE p->>'ean'=r#>>ARRAY['items',k::text,'ean'] AND p->>'quantity'=sub->>'quantity' AND p->>'unitCents'=sub->>'unitCents';IF pdf_item IS NULL THEN RAISE EXCEPTION 'Os itens diferem do PDF faturado.'; END IF; END IF;k:=k+1;
    END LOOP;
    IF amount NOT BETWEEN 1 AND 9000000000000 OR settlement_value->>'totalCents' IS DISTINCT FROM amount::text OR (settlement_value ? 'pdf' AND settlement_value#>>'{pdf,totalCents}' IS DISTINCT FROM amount::text) THEN RAISE EXCEPTION 'A soma dos itens difere do valor faturado.'; END IF;
   END IF;
  END LOOP;
  RETURN new;
 END;
 END IF;
 IF TG_OP='INSERT' AND new.revision<>1 THEN RAISE EXCEPTION 'Revisão inicial inválida.' USING ERRCODE='22023'; END IF;
 IF TG_OP='UPDATE' THEN
  IF new.user_id<>old.user_id OR new.id<>old.id OR new.kind<>old.kind OR new.revision<>old.revision+1 THEN RAISE EXCEPTION 'Registro ou revisão inválidos.' USING ERRCODE='40001'; END IF;
  IF new.kind='sale' AND old.data->>'status' IN ('confirmed','cancelled') THEN
   IF (d-ARRAY['status','cancelReason','updatedAt','version','manualBilling']) IS DISTINCT FROM (old.data-ARRAY['status','cancelReason','updatedAt','version','manualBilling']) OR d->>'status' NOT IN ('confirmed','cancelled') OR (old.data->>'status'='cancelled' AND d->>'status'<>'cancelled') THEN RAISE EXCEPTION 'A venda salva preserva seus produtos e preços. Cancele e registre outra venda.' USING ERRCODE='22023'; END IF;
   IF d->>'status'='cancelled' AND coalesce(length(btrim(d->>'cancelReason')),0)=0 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento.'; END IF;
   RETURN new;
  END IF;
  IF new.kind='sale' AND (d->>'clientId' IS DISTINCT FROM old.data->>'clientId' OR d->>'visitId' IS DISTINCT FROM old.data->>'visitId') THEN RAISE EXCEPTION 'Não é permitido trocar o cliente ou a visita do registro.'; END IF;
 END IF;
 IF new.kind='product' THEN
  IF coalesce(length(btrim(d->>'name')),0) NOT BETWEEN 1 AND 160 OR coalesce(d->>'priceCents','') !~ '^[0-9]+$' OR (d->>'priceCents')::bigint NOT BETWEEN 1 AND 1000000000 THEN RAISE EXCEPTION 'Produto ou preço de tabela inválido.' USING ERRCODE='22023'; END IF;
 ELSIF new.kind='campaign' THEN
  IF coalesce(length(btrim(d->>'name')),0) NOT BETWEEN 1 AND 160 OR coalesce(d->>'type','') NOT IN ('dia_d','acelera') OR coalesce(d->>'startDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(d->>'endDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR (d->>'endDate')::date<(d->>'startDate')::date THEN RAISE EXCEPTION 'Campanha ou validade inválida.'; END IF;
  IF d->>'type'='dia_d' AND d->>'startDate'<>d->>'endDate' THEN RAISE EXCEPTION 'O Dia D vale por uma data.'; END IF;
  IF d->>'type'='acelera' AND ((d->>'startDate')::date<>date_trunc('month',(d->>'startDate')::date)::date OR (d->>'endDate')::date<>((d->>'startDate')::date+interval '1 month'-interval '1 day')::date) THEN RAISE EXCEPTION 'O Acelera deve cobrir o mês inteiro.'; END IF;
  SELECT data INTO p FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='product' AND id::text=d->>'productId';
  IF p IS NULL THEN RAISE EXCEPTION 'Produto da campanha não encontrado na sua conta.'; END IF;
  IF jsonb_typeof(d->'tiers') IS DISTINCT FROM 'array' OR jsonb_array_length(d->'tiers') NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Cadastre de uma a três faixas.'; END IF;
  base:=(p->>'priceCents')::bigint;
  FOR t IN SELECT value FROM jsonb_array_elements(d->'tiers') LOOP
   IF coalesce(t->>'minQty','') !~ '^[0-9]+$' OR coalesce(t->>'discountBps','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Faixa inválida.'; END IF;
   qty:=(t->>'minQty')::bigint;bps:=(t->>'discountBps')::integer;
   IF qty NOT BETWEEN 1 AND 1000000 OR qty<=prior_qty OR bps NOT BETWEEN 0 AND 10000 OR bps<prior_bps THEN RAISE EXCEPTION 'Confira os mínimos e descontos progressivos.'; END IF;
   IF direct_mode IS NOT NULL AND direct_mode IS DISTINCT FROM (t ? 'unitPriceCents') THEN RAISE EXCEPTION 'Use o mesmo modo de cálculo em todas as faixas.'; END IF;
   direct_mode:=t ? 'unitPriceCents';
   IF direct_mode THEN
    IF coalesce(t->>'unitPriceCents','') !~ '^[0-9]+$' OR bps<>0 THEN RAISE EXCEPTION 'Preço unitário da faixa inválido.'; END IF;
    offered_unit:=(t->>'unitPriceCents')::bigint;
    IF offered_unit NOT BETWEEN 1 AND base OR (prior_unit IS NOT NULL AND offered_unit>prior_unit) THEN RAISE EXCEPTION 'Os preços das faixas não podem superar a tabela nem aumentar nas próximas faixas.'; END IF;
    prior_unit:=offered_unit;
   END IF;
   prior_qty:=qty;prior_bps:=bps;
  END LOOP;
 ELSE
  IF coalesce(length(d->>'clientId'),0) NOT BETWEEN 1 AND 250 OR coalesce(d->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(d->>'status','') NOT IN ('confirmed','no_sale','deferred') THEN RAISE EXCEPTION 'Dados da venda inválidos.'; END IF;
  PERFORM (d->>'date')::date;
  IF nullif(d->>'visitId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.traxelo_visit_events WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND id::text=d->>'visitId' AND client_id=d->>'clientId' AND status='confirmed') THEN RAISE EXCEPTION 'Confirme e sincronize a visita antes de enviar sua venda.'; END IF;
  IF jsonb_typeof(d->'lines') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Produtos inválidos.'; END IF;
  count_lines:=jsonb_array_length(d->'lines');
  IF d->>'status' IN ('no_sale','deferred') THEN
   IF d ? 'source' THEN RAISE EXCEPTION 'PDF faturado requer uma venda confirmada.';END IF;
   IF count_lines<>0 OR d->>'totalCents' IS DISTINCT FROM '0' THEN RAISE EXCEPTION 'Registro sem venda não pode ter valores.'; END IF;
   RETURN new;
  END IF;
  IF count_lines NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Adicione de um a cem produtos.'; END IF;
  IF d ? 'source' THEN
DECLARE who uuid:=new.user_id; portfolio uuid:=new.portfolio_id; sale_id uuid:=new.id; src jsonb:=d->'source'; r jsonb; item jsonb; l jsonb; p jsonb; ri integer; ii integer; key text; seen text[]:='{}'; refs text[]:='{}'; hashes text[]:='{}'; item_ids text[]; first_cnpj text; receipt_total bigint; grand_total bigint:=0; item_count integer:=0; qty bigint; unit_price bigint; base bigint; bps bigint;
BEGIN
 IF src->>'type' IS DISTINCT FROM 'mercado_farma_pdf' OR src->>'version' IS DISTINCT FROM '1' OR src->>'reviewed' IS DISTINCT FROM 'true' OR d->>'status' IS DISTINCT FROM 'confirmed' THEN RAISE EXCEPTION 'Conferência dos PDFs inválida.';END IF;
 IF jsonb_typeof(src->'receipts') IS DISTINCT FROM 'array' OR jsonb_array_length(src->'receipts') NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'Importe um ou dois PDFs por venda.';END IF;
 -- Lock the owner/portfolio receipt namespace to serialize duplicate checks on two devices.
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text||':'||portfolio::text||':invoice_pdf',0));
 FOR r IN SELECT value FROM jsonb_array_elements(src->'receipts') LOOP
  IF r->>'provider' IS DISTINCT FROM 'mercado_farma' OR coalesce(r->>'orderNumber','') !~ '^[0-9]{1,30}$' OR coalesce(r->>'sha256','') !~ '^[a-f0-9]{64}$' OR coalesce(r->>'cnpj','') !~ '^[0-9]{14}$' OR coalesce(r->>'invoiceDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(r->>'invoiceNumber','') !~ '^[0-9]{0,30}$' OR coalesce(r->>'externalOrder','') !~ '^[0-9]{0,30}$' OR coalesce(length(r->>'fileName'),0) NOT BETWEEN 1 AND 200 OR r->>'distributor' IS NULL OR length(r->>'distributor')>80 THEN RAISE EXCEPTION 'Origem do PDF inválida.';END IF;
  PERFORM (r->>'invoiceDate')::date;
  IF first_cnpj IS NOT NULL AND r->>'cnpj'<>first_cnpj THEN RAISE EXCEPTION 'Os PDFs pertencem a clientes diferentes.';END IF;first_cnpj:=r->>'cnpj';
  IF (r->>'orderNumber')=ANY(refs) OR (r->>'sha256')=ANY(hashes) THEN RAISE EXCEPTION 'O mesmo pedido foi selecionado duas vezes.';END IF;
  refs:=array_append(refs,r->>'orderNumber');hashes:=array_append(hashes,r->>'sha256');
  IF EXISTS(SELECT 1 FROM public.rotamapa_commerce_items x CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(x.data->'source'->'receipts')='array' THEN x.data->'source'->'receipts' ELSE '[]'::jsonb END) prior WHERE x.user_id=who AND x.portfolio_id=portfolio AND x.kind='sale' AND x.id<>sale_id AND x.data->>'status'='confirmed' AND (prior->>'sha256'=r->>'sha256' OR (prior->>'provider'=r->>'provider' AND prior->>'orderNumber'=r->>'orderNumber'))) THEN RAISE EXCEPTION 'Um destes pedidos já está registrado nesta carteira.' USING ERRCODE='23505';END IF;
  IF jsonb_typeof(r->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(r->'items') NOT BETWEEN 1 AND 100 OR coalesce(r->>'totalCents','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Itens faturados inválidos.';END IF;
  receipt_total:=0;item_ids:='{}';
  FOR item IN SELECT value FROM jsonb_array_elements(r->'items') LOOP
   IF coalesce(item->>'itemNumber','') !~ '^[0-9]+$' OR (item->>'itemNumber')::bigint NOT BETWEEN 1 AND 10000 OR (item->>'itemNumber')=ANY(item_ids) OR coalesce(item->>'ean','') !~ '^[0-9]{13,14}$' OR coalesce(length(btrim(item->>'description')),0) NOT BETWEEN 1 AND 500 OR coalesce(item->>'quantity','') !~ '^[0-9]+$' OR coalesce(item->>'unitCents','') !~ '^[0-9]+$' OR coalesce(item->>'totalCents','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Item faturado inválido.';END IF;
   item_ids:=array_append(item_ids,item->>'itemNumber');qty:=(item->>'quantity')::bigint;unit_price:=(item->>'unitCents')::bigint;
   IF qty NOT BETWEEN 1 AND 1000000 OR unit_price NOT BETWEEN 0 AND 1000000000 OR item->>'totalCents' IS DISTINCT FROM (qty*unit_price)::text THEN RAISE EXCEPTION 'Total do item do PDF divergente.';END IF;
   receipt_total:=receipt_total+qty*unit_price;item_count:=item_count+1;
  END LOOP;
  IF receipt_total NOT BETWEEN 1 AND 9000000000000 OR r->>'totalCents' IS DISTINCT FROM receipt_total::text THEN RAISE EXCEPTION 'Itens divergem do total faturado.';END IF;
  grand_total:=grand_total+receipt_total;
 END LOOP;
 IF item_count<>jsonb_array_length(d->'lines') OR item_count>100 OR grand_total>9000000000000 OR d->>'totalCents' IS DISTINCT FROM grand_total::text THEN RAISE EXCEPTION 'Confira os itens e a soma dos PDFs.';END IF;
 FOR l IN SELECT value FROM jsonb_array_elements(d->'lines') LOOP
  IF coalesce(l->>'sourceReceipt','') !~ '^[0-9]+$' OR coalesce(l->>'sourceItem','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Item sem origem no PDF.';END IF;
  ri:=(l->>'sourceReceipt')::integer;ii:=(l->>'sourceItem')::integer;key:=ri::text||':'||ii::text;
  IF ri NOT BETWEEN 0 AND jsonb_array_length(src->'receipts')-1 OR ii<0 OR key=ANY(seen) THEN RAISE EXCEPTION 'Origem do item inválida ou repetida.';END IF;
  r:=src->'receipts'->ri;IF ii>=jsonb_array_length(r->'items') THEN RAISE EXCEPTION 'Item não existe no PDF.';END IF;
  item:=r->'items'->ii;seen:=array_append(seen,key);
  SELECT data INTO p FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='product' AND id::text=l->>'productId';
  IF p IS NULL OR coalesce((p->>'disabled')::boolean,false) OR l->>'name' IS DISTINCT FROM p->>'name' OR l->>'tableUnitCents' IS DISTINCT FROM p->>'priceCents' THEN RAISE EXCEPTION 'Confira os produtos no catálogo desta carteira.';END IF;
  base:=(p->>'priceCents')::bigint;unit_price:=(item->>'unitCents')::bigint;bps:=greatest(0,((base-unit_price)*10000+base/2)/base);
  IF l->>'quantity' IS DISTINCT FROM item->>'quantity' OR l->>'unitCents' IS DISTINCT FROM item->>'unitCents' OR l->>'totalCents' IS DISTINCT FROM item->>'totalCents' OR l->>'label' IS DISTINCT FROM 'Preço faturado no PDF' OR l->>'minQty' IS DISTINCT FROM '0' OR l->>'discountBps' IS DISTINCT FROM bps::text OR l->'campaign' IS DISTINCT FROM 'null'::jsonb OR l ? 'unitPriceCents' THEN RAISE EXCEPTION 'Venda difere dos itens faturados do PDF.';END IF;
 END LOOP;
END;
   RETURN new;
  END IF;
  FOR l IN SELECT value FROM jsonb_array_elements(d->'lines') LOOP
   SELECT data INTO p FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='product' AND id::text=l->>'productId';
   IF p IS NULL OR coalesce((p->>'disabled')::boolean,false) OR (l->>'productId')=ANY(ids) THEN RAISE EXCEPTION 'Produto inválido ou repetido.'; END IF;
   ids:=array_append(ids,l->>'productId');
   IF coalesce(l->>'quantity','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Quantidade inválida.'; END IF;
   qty:=(l->>'quantity')::bigint;base:=(p->>'priceCents')::bigint;
   IF qty NOT BETWEEN 1 AND 1000000 OR l->>'tableUnitCents' IS DISTINCT FROM base::text OR l->>'name' IS DISTINCT FROM p->>'name' THEN RAISE EXCEPTION 'O preço ou nome do catálogo mudou. Atualize o produto e confira o pedido.'; END IF;
   bps:=0;chosen_min:=0;chosen_label:='Preço de tabela';offered_unit:=NULL;
   IF l->'campaign' IS NOT NULL AND l->'campaign'<>'null'::jsonb THEN
    SELECT data INTO c FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='campaign' AND id::text=l->'campaign'->>'id';
    IF c IS NULL OR c->>'productId' IS DISTINCT FROM l->>'productId' OR coalesce((c->>'disabled')::boolean,false) OR (d->>'date')::date NOT BETWEEN (c->>'startDate')::date AND (c->>'endDate')::date THEN RAISE EXCEPTION 'Campanha inválida para o produto ou data.'; END IF;
    IF ((l->'campaign')-ARRAY['version','updatedAt']) IS DISTINCT FROM (c-ARRAY['version','updatedAt']) THEN RAISE EXCEPTION 'As condições da campanha mudaram. Confira e aplique novamente.'; END IF;
    FOR t IN SELECT value FROM jsonb_array_elements(c->'tiers') LOOP
     IF qty>=(t->>'minQty')::bigint THEN bps:=(t->>'discountBps')::integer;chosen_min:=(t->>'minQty')::bigint;chosen_label:=t->>'label';offered_unit:=(t->>'unitPriceCents')::bigint;END IF;
    END LOOP;
   END IF;
   IF offered_unit IS NOT NULL THEN
    IF offered_unit NOT BETWEEN 1 AND base THEN RAISE EXCEPTION 'Confira o preço da faixa e a tabela atual.'; END IF;
    unit_price:=offered_unit;bps:=((base-unit_price)*10000+base/2)/base;
   ELSE unit_price:=(base*(10000-bps)+5000)/10000;END IF;
   IF (offered_unit IS NOT NULL AND l->>'unitPriceCents' IS DISTINCT FROM offered_unit::text) OR (offered_unit IS NULL AND l ? 'unitPriceCents') THEN RAISE EXCEPTION 'Preço unitário informado difere da faixa.';END IF;
   line_total:=unit_price*qty;
   IF l->>'discountBps' IS DISTINCT FROM bps::text OR l->>'minQty' IS DISTINCT FROM chosen_min::text OR l->>'label' IS DISTINCT FROM chosen_label OR l->>'unitCents' IS DISTINCT FROM unit_price::text OR l->>'totalCents' IS DISTINCT FROM line_total::text THEN RAISE EXCEPTION 'Cálculo inválido. Aplique o desconto novamente.';END IF;
   total:=total+line_total;
  END LOOP;
  IF total>9000000000000 OR d->>'totalCents' IS DISTINCT FROM total::text THEN RAISE EXCEPTION 'Total do pedido inválido.'; END IF;
 END IF;
 RETURN new;
END;$function$
;
COMMIT;
