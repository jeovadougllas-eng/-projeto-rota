import {validCnpj} from './cnpj-biz.mjs';
export const SOURCE='BrasilAPI · consulta pública',ROOT='https://brasilapi.com.br/api/cnpj/v1/';
const text=v=>typeof v==='string'?v.trim().slice(0,500):typeof v==='number'&&Number.isFinite(v)?String(v):'';
export function parseBrasilApi(value,cnpj){
 if(!validCnpj(cnpj)||!value||typeof value!=='object'||Array.isArray(value)||typeof value.cnpj!=='string'||value.cnpj.replace(/\D/g,'')!==cnpj)throw Error('CNPJ divergente na resposta pública.');
 const name=text(value.razao_social);if(!name)throw Error('Razão social pública não identificada.');
 const phone=text(value.ddd_telefone_1),email=text(value.email),zip=text(value.cep).replace(/\D/g,'');
 const kind=text(value.descricao_tipo_de_logradouro),road=text(value.logradouro),street=kind&&road&&!road.toUpperCase().startsWith(kind.toUpperCase()+' ')?kind+' '+road:road;
 const data={cnpj,name,fantasyName:text(value.nome_fantasia),street,houseNumber:text(value.numero),complement:text(value.complemento),neighborhood:text(value.bairro),city:text(value.municipio),state:/^[A-Z]{2}$/.test(text(value.uf).toUpperCase())?text(value.uf).toUpperCase():'',cep:/^\d{8}$/.test(zip)?zip:'',phone:/^[+\d\s()-]{8,25}$/.test(phone)?phone:'',email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:''};
 const fields=[['Razão social',name],['Nome fantasia',data.fantasyName],['Logradouro',street],['Número',data.houseNumber],['Complemento',data.complement],['Bairro',data.neighborhood],['Município',data.city],['UF',data.state],['CEP',data.cep],['Telefone',data.phone],['E-mail',data.email],['Situação cadastral',text(value.descricao_situacao_cadastral)],['Data de abertura',text(value.data_inicio_atividade)],['CNAE principal',text(value.cnae_fiscal_descricao)],['Porte',text(value.porte)]].filter(([,v])=>v);
 return{...data,companyData:{cnpj,source:SOURCE,url:ROOT+cnpj,checkedAt:new Date().toISOString(),fields}};
}
export async function lookupBrasilApi(cnpj,fetcher=fetch){
 const r=await fetcher(ROOT+cnpj,{headers:{Accept:'application/json','User-Agent':'RotaMapa/1.0 (+https://traxio-preview.vercel.app/)'},signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok){const e=Error('Consulta pública indisponível.');e.status=[403,404,429].includes(r.status)?r.status:502;throw e;}
 if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Formato público não reconhecido.');
 let body='';if(r.body?.getReader){const reader=r.body.getReader(),decoder=new TextDecoder();let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>131072){await reader.cancel();throw Error('Resposta pública muito extensa.');}body+=decoder.decode(value,{stream:true});}body+=decoder.decode();}else{body=await r.text();if(new TextEncoder().encode(body).length>131072)throw Error('Resposta pública muito extensa.');}
 return parseBrasilApi(JSON.parse(body),cnpj);
}
