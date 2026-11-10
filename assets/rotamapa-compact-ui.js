/* Compact actions preserve original handlers, page illustrations and storage. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 function disclosure(section,title){if(!section)return;const h=section.querySelector(':scope>h3,:scope>h4');const d=document.createElement('details'),s=document.createElement('summary');d.className='rm-compact-disclosure';s.textContent=title||h?.textContent||'Opções';d.append(s);for(const child of [...section.childNodes])if(child!==h)d.append(child);h?.remove();section.append(d);return d;}
 for(const [id,title]of [['commercialCampaigns','Campanhas'],['commercialMaterials','Material de Divulgação'],['commercialCommissions','Projeção de comissões'],['commercialConsultations','Consultas']])disclosure($(id),title);
 disclosure(document.querySelector('#links .useful-welcome'),'Como adicionar seus atalhos');
 for(const id of ['commercialCatalog','commercialBoxes','commercialLibrary'])disclosure($(id));
 document.querySelectorAll('#commercialCommissions details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)window.dispatchEvent(new Event('rotamapa:commission-open'));}));
 document.addEventListener('DOMContentLoaded',()=>{const planner=$('routePlannerPanel'),workspace=document.querySelector('#mapa .workspace');if(planner&&workspace)workspace.after(planner);});
 const quick=document.querySelector('.field-quick-actions,.quick-actions');if(quick)quick.classList.add('rm-compact-actions');
})();
