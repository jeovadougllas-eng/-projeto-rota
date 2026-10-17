// Synthetic records for isolated browser tests. Never loaded by the application.
const names = ['T & S EMPREENDIMENTOS FARMACEUTICOS LTDA','FERREIRA & VOLLET LTDA','FARMACIA GUARARAPES LTDA','FARMANORTE FARMACIA ZONA NORTE LTDA','M C DE A BEZERRA','DROGARIA BANDEIRANTES LTDA'];
const districts = ['Lagoa Nova','Alecrim','Tirol','Pajuçara','Cidade Alta','Neópolis'];
export const clients = Array.from({length:157},(_,i)=>({
  id:'synthetic-client-'+i,
  name:i<names.length ? names[i] : `CLIENTE DE TESTE ${String(i+1).padStart(3,'0')}`,
  address:['RUA MIRA MANGUE, 922 LOTE 09 QUADRA 422, NATAL','RUA DR ALVARO OZORIO DE ALMEIDA, 296 LET, NATAL','RUA LUIZ XV, 770, NATAL','RUA ITAPERUNA, 2109 B CONJ SANTA CATARINA, NATAL'][i%4],
  city:i<150?'Natal':'Parnamirim',neighborhood:districts[i%districts.length],priority:2,lat:null,lon:null,
  category:'Farmácia', importFields:[{label:'CNPJ',value:'00.000.000/0001-00'},{label:'Categoria',value:'Farmácia'},{label:'Cidade',value:i<150?'Natal':'Parnamirim'},{label:'Bairro',value:districts[i%districts.length]}]
}));
