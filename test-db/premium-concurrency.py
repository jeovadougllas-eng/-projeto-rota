"""Isolated CI Postgres: concurrent RPCs cannot overrun the Free quota."""
from concurrent.futures import ThreadPoolExecutor
import subprocess, json
owner='e64d0db2-f5d8-461a-8799-194d405bfdb1'
def sql(text,check=True):
    return subprocess.run(['psql','-X','-v','ON_ERROR_STOP=1','-Atc',text],capture_output=True,text=True,check=check)
sql(f"insert into auth.users(id) values('{owner}'); insert into public.traxelo_plan_grants(user_id,plan) values('{owner}','free');")
payload=json.dumps({'name':'Concurrent fixture','start':{'lat':-5.8,'lon':-35.2},'points':[{'lat':-5.81,'lon':-35.21}]})
def save(i):
    return sql(f"begin;set local role authenticated;select set_config('request.jwt.claims','{{\"sub\":\"{owner}\",\"is_anonymous\":false}}',true);select public.traxelo_write_item('e64d0db2-f5d8-461a-8799-{i:012d}','route','{payload}',0);select pg_sleep(0.1);commit;",False)
with ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(save,range(100,112)))
assert sum(r.returncode==0 for r in results)==3,[(r.returncode,r.stderr)for r in results]
assert sql(f"select count(*) from public.traxelo_workspace_items where user_id='{owner}' and not deleted").stdout.strip()=='3'
assert all(r.returncode==0 or 'Limite de rotas salvas' in r.stderr for r in results)
print('Concurrent quota passed: exactly 3 of 12 overlapping Free saves accepted, 9 rejected.')
