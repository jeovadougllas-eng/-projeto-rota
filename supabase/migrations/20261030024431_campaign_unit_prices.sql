-- Adds exact unit-price tiers without rewriting catalog, campaigns or historical sales.
BEGIN;
CREATE OR REPLACE FUNCTION rotamapa_private.validate_commerce()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE d jsonb:=new.data; t jsonb; l jsonb; p jsonb; c jsonb; qty bigint; base bigint; bps integer; unit_price bigint; line_total bigint; total bigint:=0; prior_qty bigint:=0; prior_bps integer:=-1; chosen_min bigint; chosen_label text; count_lines integer; ids text[]:='{}'; offered_unit bigint; prior_unit bigint; direct_mode boolean;
BEGIN
 IF TG_OP='INSERT' AND new.revision<>1 THEN RAISE EXCEPTION 'Revisão inicial inválida.' USING ERRCODE='22023'; END IF;
 IF TG_OP='UPDATE' THEN
  IF new.user_id<>old.user_id OR new.id<>old.id OR new.kind<>old.kind OR new.revision<>old.revision+1 THEN RAISE EXCEPTION 'Registro ou revisão inválidos.' USING ERRCODE='40001'; END IF;
  IF new.kind='sale' AND old.data->>'status' IN ('confirmed','cancelled') THEN
   IF (d-ARRAY['status','cancelReason','updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['status','cancelReason','updatedAt','version']) OR d->>'status' NOT IN ('confirmed','cancelled') OR (old.data->>'status'='cancelled' AND d->>'status'<>'cancelled') THEN RAISE EXCEPTION 'A venda salva preserva seus produtos e preços. Cancele e registre outra venda.' USING ERRCODE='22023'; END IF;
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
   IF count_lines<>0 OR d->>'totalCents' IS DISTINCT FROM '0' THEN RAISE EXCEPTION 'Registro sem venda não pode ter valores.'; END IF;
   RETURN new;
  END IF;
  IF count_lines NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Adicione de um a cem produtos.'; END IF;
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
END;$function$;

REVOKE ALL ON FUNCTION rotamapa_private.validate_commerce() FROM public,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
