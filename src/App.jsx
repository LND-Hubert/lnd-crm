import { useState, useMemo } from "react";

// ── COULEURS ──────────────────────────────────────────────────────────
const NAVY = "#1B2A4A";
const NAVY2 = "#2C3E6B";
const GOLD = "#B8963E";
const GOLD_L = "#D4AF6A";
const CREAM = "#F5F0EA";
const WHITE = "#FDFCFA";
const GREEN = "#27ae60";
const RED = "#c0392b";
const ORANGE = "#e67e22";

// ── CONSTANTES OPÉRATIONNEL ───────────────────────────────────────────
const EMPTY_MONTH = { ca:0, couverts:0, tickets:0, masseSalariale:0, coutsMatieres:0, chargesFixes:0 };
const MONTHS_OP = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const MONTH_LABELS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const MONTHS_S = ["J","F","M","A","M","J","J","A","S","O","N","D"];
function emptyMonths() { return Object.fromEntries(MONTHS_OP.map(m=>[m,{...EMPTY_MONTH}])); }

function calcRatios(d) {
  const ca=d.ca||0, cov=d.couverts||0, tick=d.tickets||0, ms=d.masseSalariale||0, cm=d.coutsMatieres||0, cf=d.chargesFixes||0;
  const ticketMoyen=tick>0?ca/tick:0, coutParCouvert=cov>0?ca/cov:0;
  const ratioMS=ca>0?(ms/ca)*100:0, ratioCM=ca>0?(cm/ca)*100:0;
  const margeBrute=ca-cm, tauxMargeBrute=ca>0?(margeBrute/ca)*100:0;
  const chargesTotal=ms+cm+cf, ebe=ca-chargesTotal, tauxEBE=ca>0?(ebe/ca)*100:0;
  const tauxCV=ca>0?(ms+cm)/ca:0, pointMort=tauxCV<1?cf/(1-tauxCV):0;
  return {ticketMoyen,coutParCouvert,ratioMS,ratioCM,margeBrute,tauxMargeBrute,chargesTotal,ebe,tauxEBE,pointMort};
}
function calcAnnuel(months) {
  const t={ca:0,couverts:0,tickets:0,masseSalariale:0,coutsMatieres:0,chargesFixes:0};
  MONTHS_OP.forEach(m=>{const d=months[m]||EMPTY_MONTH;Object.keys(t).forEach(k=>t[k]+=d[k]||0);});
  return {...t,...calcRatios(t)};
}

// ── CONSTANTES COMMERCIAL ─────────────────────────────────────────────
const STAGES = ["Prospect","Contacté","Intéressé","Pas intéressé","Négo en cours","Validé","À relancer"];
const STAGE_STYLE = {
  "Prospect":      {bg:"#EEF2FA",color:"#3A5A9A",dot:"#3A5A9A"},
  "Contacté":      {bg:"#FDF6E3",color:"#8A6500",dot:"#C49A00"},
  "Intéressé":     {bg:"#E8F5EE",color:"#1A6E3A",dot:"#27AE60"},
  "Pas intéressé": {bg:"#FDEAEA",color:"#8B2020",dot:RED},
  "Négo en cours": {bg:"#FFF0E0",color:"#8A4500",dot:ORANGE},
  "Validé":        {bg:"#E3F5E8",color:"#145228",dot:GREEN,bold:true},
  "À relancer":    {bg:"#F3E8FF",color:"#5A2080",dot:"#9B59B6"},
};
const REGIONS = ["Île-de-France","Auvergne-Rhône-Alpes","Bretagne","Centre-Val de Loire","Grand Est","Hauts-de-France","Normandie","Nouvelle-Aquitaine","Occitanie","Pays de la Loire","Provence-Alpes-Côte d'Azur","Bourgogne-Franche-Comté","Corse","Autre"];
const FORFAITS = [
  {id:"direction",nom:"Direction Opérationnelle",icon:"🎯",description:"Prise en charge complète de la direction quotidienne.",options:[
    {id:"dir-tp",label:"Temps plein",prix:4500,periode:"mois",detail:"Direction 5j/7 — management, service, qualité, planning"},
    {id:"dir-pp",label:"Temps partagé",prix:2800,periode:"mois",detail:"Direction 2 à 3j/semaine"},
    {id:"dir-ponc",label:"Mission ponctuelle",prix:1200,periode:"intervention",detail:"Audit, remplacement, ouverture ou lancement"},
  ],color:"#3A5A9A",bg:"#EEF2FA"},
  {id:"pilotage",nom:"Pilotage Financier",icon:"📊",description:"Maîtrise et optimisation des indicateurs de performance.",options:[
    {id:"pil-complet",label:"Pilotage complet",prix:1800,periode:"mois",detail:"Ratios, coûts matières, masse salariale, EBE + reporting"},
    {id:"pil-light",label:"Pilotage essentiel",prix:990,periode:"mois",detail:"Tableaux de bord mensuels + alerte ratios clés"},
    {id:"pil-audit",label:"Audit financier",prix:1500,periode:"intervention",detail:"Diagnostic complet one-shot avec recommandations"},
  ],color:"#145228",bg:"#E3F5E8"},
  {id:"groupes",nom:"Accompagnement Groupes",icon:"🏢",description:"Direction centralisée multi-sites.",options:[
    {id:"grp-2",label:"2 établissements",prix:6500,periode:"mois",detail:"Coordination, reporting consolidé, 2 sites"},
    {id:"grp-3",label:"3 à 5 établissements",prix:9500,periode:"mois",detail:"Direction centralisée + standardisation"},
    {id:"grp-6",label:"6 établissements +",prix:0,periode:"mois",detail:"Sur devis — tarif dégressif selon volume"},
  ],color:"#8A4500",bg:"#FFF0E0"},
];

// ── DONNÉES INITIALES ─────────────────────────────────────────────────
const USERS_ALL = [
  {id:"president",email:"hubert@lesnouveauxdirecteurs.com",password:"Hayden10@",role:"president",name:"Hubert Deneux",avatar:"HD"},
  {id:"caroline",email:"caroline@lesnouveauxdirecteurs.com",password:"Vadim12@",role:"commercial",name:"Caroline Deneux",avatar:"CD"},
];

const INIT_RESTAURANTS_OP = [];

const INIT_PROSPECTS = [];

// ── UTILS ─────────────────────────────────────────────────────────────
const fmtEur = n => n>=1000000?`${(n/1000000).toFixed(2)}M€`:n>=1000?`${(n/1000).toFixed(0)}k€`:n>0?`${n}€`:"—";
const fmtNum = n => n>=1000?`${(n/1000).toFixed(1)}k`:`${Math.round(n)}`;
const fmtPct = n => `${n.toFixed(1)}%`;
const fmtDate = d => d?new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"";
const isOverdue = d => d&&new Date(d)<new Date();
const isSoon = d => {if(!d)return false;const diff=(new Date(d)-new Date())/86400000;return diff>=0&&diff<=3;};
const ratioColor = (v,thresholds) => v===0?"#aaa":v>thresholds.bad?RED:v>thresholds.warn?ORANGE:GREEN;

// ── COMPOSANTS PARTAGÉS ───────────────────────────────────────────────
function Sparkline({data,color=GOLD,width=80,height=28}) {
  const vals=(data||[]).filter(v=>v>0);
  if(vals.length<2) return <span style={{color:"#ddd",fontSize:11}}>—</span>;
  const all=data||[];
  const nzi=all.map((v,i)=>[v,i]).filter(([v])=>v>0).map(([,i])=>i);
  const slice=all.slice(nzi[0],nzi[nzi.length-1]+1);
  const max=Math.max(...slice,1),min=Math.min(...slice.filter(v=>v>0)),range=max-min||1;
  const W=width,H=height;
  const pts=slice.map((v,i)=>`${(i/(slice.length-1||1))*W},${H-((v-min)/range)*(H-6)-3}`).join(" ");
  const trend=slice[slice.length-1]>slice[0];
  const c=trend?GREEN:RED;
  const lpt=pts.split(" ").pop().split(",");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <polyline fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <circle cx={lpt[0]} cy={lpt[1]} r="3" fill={c}/>
    </svg>
  );
}

function SparklineOp({data,color=GOLD}) {
  const vals=MONTHS_OP.map(m=>(data[m]||EMPTY_MONTH).ca||0);
  const max=Math.max(...vals,1),min=Math.min(...vals),range=max-min||1;
  const W=80,H=24;
  const nonZero=vals.filter(v=>v>0);
  if(nonZero.length<2) return <span style={{color:"#ccc",fontSize:11}}>—</span>;
  const pts=vals.map((v,i)=>`${(i/11)*W},${H-((v-min)/range)*(H-4)-2}`).join(" ");
  const last=vals.lastIndexOf(Math.max(...vals.filter(Boolean)));
  const lx=(last/11)*W,ly=H-((vals[last]-min)/range)*(H-4)-2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <circle cx={lx} cy={ly} r="3" fill={color}/>
    </svg>
  );
}

function StageBadge({stage}) {
  const s=STAGE_STYLE[stage]||{};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:s.bg,color:s.color,padding:"3px 9px",borderRadius:3,fontSize:11,fontWeight:s.bold?700:500,fontFamily:"sans-serif",whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{stage}</span>;
}

function RappelBadge({date}) {
  if(!date) return <span style={{color:"#ccc",fontSize:12}}>—</span>;
  const over=isOverdue(date),soon=isSoon(date);
  return <span style={{fontSize:11,fontWeight:500,color:over?RED:soon?ORANGE:NAVY,background:over?"#FDEAEA":soon?"#FFF0E0":"transparent",padding:(over||soon)?"3px 8px":"0",borderRadius:3}}>{over?"⚠ ":""}{fmtDate(date)}</span>;
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState("");
  function handle() {
    const u=USERS_ALL.find(u=>u.email===email&&u.password===pwd);
    if(u){setErr("");onLogin(u);}else setErr("Identifiant ou mot de passe incorrect.");
  }
  return (
    <div style={{minHeight:"100vh",background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
      <div style={{width:420,background:WHITE,borderRadius:12,padding:"48px 44px",boxShadow:"0 40px 100px rgba(0,0,0,0.4)",borderTop:`4px solid ${GOLD}`}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:52,fontWeight:700,color:NAVY,letterSpacing:-2,lineHeight:1,fontFamily:"Georgia,serif"}}>LND</div>
          <div style={{fontSize:10,letterSpacing:5,color:GOLD,textTransform:"uppercase",fontWeight:700,marginTop:6,fontFamily:"sans-serif"}}>Les Nouveaux Directeurs</div>
          <div style={{width:40,height:2,background:GOLD,margin:"14px auto 0"}}/>
        </div>
        {[{l:"Email",v:email,s:setEmail,p:"votre@lnd.fr",t:"text"},{l:"Mot de passe",v:pwd,s:setPwd,p:"••••••••",t:"password"}].map(f=>(
          <div key={f.l} style={{marginBottom:14}}>
            <label style={{fontSize:9,color:GOLD,display:"block",marginBottom:5,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>{f.l}</label>
            <input value={f.v} onChange={e=>f.s(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} type={f.t} placeholder={f.p} style={{width:"100%",padding:"12px 14px",borderRadius:6,border:"1px solid rgba(27,42,74,0.2)",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"Georgia,serif",color:NAVY}}/>
          </div>
        ))}
        {err&&<div style={{background:"#fdf0f0",border:"1px solid #f5c6c6",borderRadius:6,padding:"10px 14px",fontSize:13,color:RED,marginBottom:16,fontFamily:"sans-serif"}}>{err}</div>}
        <button onClick={handle} style={{width:"100%",background:NAVY,color:CREAM,border:`1px solid ${GOLD}`,borderRadius:6,padding:14,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>Se connecter</button>
      </div>
    </div>
  );
}

// ── SAISIE MENSUELLE (opérationnel) ───────────────────────────────────
function SaisieModal({restaurant,onSave,onClose}) {
  const [selMonth,setSelMonth]=useState(MONTHS_OP[new Date().getMonth()]);
  const [data,setData]=useState({...(restaurant.months[selMonth]||EMPTY_MONTH)});
  function switchMonth(m){setSelMonth(m);setData({...(restaurant.months[m]||EMPTY_MONTH)});}
  const ratios=calcRatios(data);
  const fields=[
    {key:"ca",label:"Chiffre d'affaires (€)",icon:"€"},
    {key:"couverts",label:"Nombre de couverts",icon:"🍽"},
    {key:"tickets",label:"Nombre de tickets",icon:"🧾"},
    {key:"masseSalariale",label:"Masse salariale (€)",icon:"👥"},
    {key:"coutsMatieres",label:"Coûts matières (€)",icon:"📦"},
    {key:"chargesFixes",label:"Charges fixes (€)",icon:"🏢"},
  ];
  const ratioItems=[
    {label:"Ticket moyen",value:fmtEur(ratios.ticketMoyen),hint:"CA / tickets",neutral:true},
    {label:"Coût / couvert",value:fmtEur(ratios.coutParCouvert),hint:"CA / couverts",neutral:true},
    {label:"Ratio masse sal.",value:fmtPct(ratios.ratioMS),hint:"Idéal < 35%",color:ratioColor(ratios.ratioMS,{bad:40,warn:35})},
    {label:"Ratio matières",value:fmtPct(ratios.ratioCM),hint:"Idéal < 30%",color:ratioColor(ratios.ratioCM,{bad:35,warn:30})},
    {label:"Marge brute",value:fmtEur(ratios.margeBrute),hint:fmtPct(ratios.tauxMargeBrute)+" du CA",color:ratios.tauxMargeBrute>60?GREEN:ratios.tauxMargeBrute>50?ORANGE:RED},
    {label:"EBE",value:fmtEur(ratios.ebe),hint:fmtPct(ratios.tauxEBE)+" du CA",color:ratios.ebe>0?GREEN:RED},
    {label:"Point mort",value:fmtEur(ratios.pointMort),hint:"CA à atteindre",neutral:true},
  ];
  const iS={width:"100%",padding:"10px 13px",borderRadius:5,border:"1px solid rgba(27,42,74,0.18)",fontSize:13,outline:"none",color:NAVY,background:WHITE,boxSizing:"border-box"};
  const lS={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:GOLD,fontWeight:700,display:"block",marginBottom:5};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(17,30,53,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:WHITE,borderRadius:12,width:"100%",maxWidth:760,maxHeight:"90vh",overflow:"auto",boxShadow:"0 40px 100px rgba(0,0,0,0.35)",borderTop:`4px solid ${GOLD}`}}>
        <div style={{padding:"24px 32px 0",borderBottom:`1px solid ${CREAM}`,position:"sticky",top:0,background:WHITE,zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div>
              <div style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Saisie des données</div>
              <h2 style={{fontSize:18,fontWeight:700,margin:0,color:NAVY}}>{restaurant.name}</h2>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#aaa"}}>✕</button>
          </div>
          <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:0,marginBottom:-1}}>
            {MONTHS_OP.map((m,i)=>{
              const hasData=(restaurant.months[m]||EMPTY_MONTH).ca>0;
              return <button key={m} onClick={()=>switchMonth(m)} style={{padding:"7px 10px",borderRadius:"6px 6px 0 0",border:`1px solid ${selMonth===m?GOLD:CREAM}`,borderBottom:selMonth===m?"1px solid #fff":`1px solid ${CREAM}`,background:selMonth===m?WHITE:hasData?"#f0f7f0":CREAM,color:selMonth===m?NAVY:hasData?GREEN:"#aaa",fontSize:10,fontWeight:selMonth===m?700:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                {MONTH_LABELS[i]}{hasData?" ✓":""}
              </button>;
            })}
          </div>
        </div>
        <div style={{padding:"22px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
            {fields.map(f=>(
              <div key={f.key}>
                <label style={lS}>{f.icon} {f.label}</label>
                <input type="number" min="0" value={data[f.key]||""} onChange={e=>setData({...data,[f.key]:parseFloat(e.target.value)||0})} placeholder="0" style={{...iS,fontSize:15,fontWeight:600}}/>
              </div>
            ))}
          </div>
          <div style={{background:NAVY,borderRadius:8,padding:"18px 22px",marginBottom:22}}>
            <div style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>⚡ Ratios calculés automatiquement</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {ratioItems.map(r=>(
                <div key={r.label} style={{background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"11px 13px"}}>
                  <div style={{fontSize:9,color:"rgba(245,240,234,0.5)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{r.label}</div>
                  <div style={{fontSize:17,fontWeight:700,color:r.neutral?CREAM:(r.color||CREAM)}}>{r.value}</div>
                  <div style={{fontSize:10,color:"rgba(245,240,234,0.35)",marginTop:2}}>{r.hint}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{onSave(selMonth,data);onClose();}} style={{flex:1,background:NAVY,color:CREAM,border:`1px solid ${GOLD}`,borderRadius:6,padding:13,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase"}}>
              Enregistrer {MONTH_LABELS[MONTHS_OP.indexOf(selMonth)]}
            </button>
            <button onClick={onClose} style={{flex:1,background:CREAM,color:NAVY,border:"1px solid rgba(27,42,74,0.2)",borderRadius:6,padding:13,fontSize:12,cursor:"pointer"}}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPTE EXPLOITATION ───────────────────────────────────────────────
function CompteExploitation({restaurant}) {
  const annuel=calcAnnuel(restaurant.months);
  const rows=[
    {label:"Chiffre d'affaires",key:"ca",fmt:fmtEur,bold:true,border:true},
    {label:"Coûts matières",key:"coutsMatieres",fmt:fmtEur,sub:true},
    {label:"Marge brute",calc:d=>d.ca-d.coutsMatieres,fmt:fmtEur,bold:true,color:d=>(d.ca-d.coutsMatieres)/Math.max(d.ca,1)*100>60?GREEN:ORANGE,border:true},
    {label:"Masse salariale",key:"masseSalariale",fmt:fmtEur,sub:true},
    {label:"Charges fixes",key:"chargesFixes",fmt:fmtEur,sub:true},
    {label:"EBE",calc:d=>d.ca-d.masseSalariale-d.coutsMatieres-d.chargesFixes,fmt:fmtEur,bold:true,color:d=>d.ca-d.masseSalariale-d.coutsMatieres-d.chargesFixes>0?GREEN:RED,border:true},
  ];
  const ratioRows=[
    {label:"Ticket moyen",calc:d=>d.tickets>0?d.ca/d.tickets:0,fmt:fmtEur},
    {label:"Couverts",key:"couverts",fmt:fmtNum},
    {label:"Ratio masse sal.",calc:d=>d.ca>0?(d.masseSalariale/d.ca*100):0,fmt:fmtPct,color:v=>ratioColor(v,{bad:40,warn:35})},
    {label:"Ratio matières",calc:d=>d.ca>0?(d.coutsMatieres/d.ca*100):0,fmt:fmtPct,color:v=>ratioColor(v,{bad:35,warn:30})},
    {label:"Taux EBE",calc:d=>d.ca>0?((d.ca-d.masseSalariale-d.coutsMatieres-d.chargesFixes)/d.ca*100):0,fmt:fmtPct,color:v=>v>10?GREEN:v>5?ORANGE:RED},
    {label:"Point mort",calc:d=>{const cv=d.masseSalariale+d.coutsMatieres;const tcv=d.ca>0?cv/d.ca:0;return tcv<1?d.chargesFixes/(1-tcv):0;},fmt:fmtEur},
  ];
  function getVal(row,d){if(row.calc)return row.calc(d);return d[row.key]||0;}
  const filled=MONTHS_OP.filter(m=>(restaurant.months[m]||EMPTY_MONTH).ca>0);
  return (
    <div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
          <thead>
            <tr style={{background:NAVY}}>
              <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1.5,minWidth:160}}>Indicateur</th>
              {MONTHS_OP.map((m,i)=>(
                <th key={m} style={{padding:"12px 8px",textAlign:"right",fontSize:10,fontWeight:700,color:filled.includes(m)?GOLD:"rgba(184,150,62,0.3)",textTransform:"uppercase",letterSpacing:1}}>{MONTH_LABELS[i]}</th>
              ))}
              <th style={{padding:"12px 10px",textAlign:"right",fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:1,background:NAVY2}}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row=>(
              <tr key={row.label} style={{borderBottom:row.border?`2px solid ${CREAM}`:`1px solid #f5f3f0`,background:row.bold?"#fafaf8":WHITE}}>
                <td style={{padding:"11px 16px",fontSize:13,fontWeight:row.bold?700:400,color:row.sub?"#888":NAVY,paddingLeft:row.sub?28:16}}>{row.label}</td>
                {MONTHS_OP.map(m=>{
                  const d=restaurant.months[m]||EMPTY_MONTH;
                  const v=getVal(row,d);
                  const hasData=d.ca>0;
                  const col=row.color?row.color(d):(row.bold?NAVY:"#555");
                  return <td key={m} style={{padding:"11px 8px",textAlign:"right",fontSize:12,fontWeight:row.bold?700:400,color:hasData?col:"#ddd"}}>{hasData?row.fmt(v):"—"}</td>;
                })}
                <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,fontWeight:700,background:"#f0ede8",color:row.color?row.color(annuel):NAVY}}>{row.fmt(getVal(row,annuel))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:22,background:NAVY,borderRadius:8,padding:"18px 22px"}}>
        <div style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Ratios clés annuels</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          {ratioRows.map(r=>{const v=getVal(r,annuel);const col=r.color?r.color(v):CREAM;return(
            <div key={r.label} style={{background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"13px"}}>
              <div style={{fontSize:9,color:"rgba(245,240,234,0.5)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{r.label}</div>
              <div style={{fontSize:19,fontWeight:700,color:col}}>{r.fmt(v)}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ── FICHE COMMERCIAL ──────────────────────────────────────────────────
function FicheCommerciale({resto,onClose,onSave}) {
  const [data,setData]=useState({...resto,caHistory:resto.caHistory||Array(12).fill(0),forfaits:resto.forfaits||[]});
  const [newRDate,setNewRDate]=useState("");
  const [newRNote,setNewRNote]=useState("");
  const set=(k,v)=>setData(d=>({...d,[k]:v}));
  const setCA=(i,v)=>{const h=[...data.caHistory];h[i]=parseFloat(v)||0;setData(d=>({...d,caHistory:h,ca:h.reduce((s,x)=>s+x,0)}));};
  const addRappel=()=>{if(!newRDate)return;set("rappels",[...(data.rappels||[]),{id:Date.now(),date:newRDate,note:newRNote}]);setNewRDate("");setNewRNote("");};
  const removeRappel=id=>set("rappels",(data.rappels||[]).filter(r=>r.id!==id));
  const addForfait=id=>{if((data.forfaits||[]).find(f=>f.optionId===id))return;set("forfaits",[...(data.forfaits||[]),{optionId:id,dateDebut:"",notes:""}]);};
  const removeForfait=id=>set("forfaits",(data.forfaits||[]).filter(f=>f.optionId!==id));
  const updForfait=(id,k,v)=>set("forfaits",(data.forfaits||[]).map(f=>f.optionId===id?{...f,[k]:v}:f));
  const getOpt=id=>FORFAITS.flatMap(f=>f.options).find(o=>o.id===id);
  const totalMensuel=(data.forfaits||[]).reduce((s,f)=>{const o=getOpt(f.optionId);return s+(o&&o.periode==="mois"?o.prix:0);},0);
  const filled=data.caHistory.filter(v=>v>0).length;
  const iS={width:"100%",padding:"10px 13px",borderRadius:5,border:"1px solid rgba(27,42,74,0.18)",fontSize:13,outline:"none",color:NAVY,background:WHITE,boxSizing:"border-box"};
  const lS={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:GOLD,fontWeight:700,display:"block",marginBottom:5};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(17,30,53,0.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:WHITE,borderRadius:10,width:"100%",maxWidth:940,maxHeight:"92vh",overflow:"auto",boxShadow:"0 40px 100px rgba(0,0,0,0.35)",borderTop:`4px solid ${GOLD}`}}>
        <div style={{background:NAVY,padding:"24px 36px 20px",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:9,letterSpacing:3,color:GOLD,textTransform:"uppercase",fontWeight:700,marginBottom:5}}>Fiche contact commercial</div>
              <input value={data.nom} onChange={e=>set("nom",e.target.value)} style={{background:"transparent",border:"none",color:CREAM,fontSize:22,fontFamily:"Georgia,serif",fontWeight:400,padding:0,width:400,outline:"none"}} placeholder="Nom du restaurant"/>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <select value={data.stage} onChange={e=>set("stage",e.target.value)} style={{...iS,width:"auto",background:STAGE_STYLE[data.stage]?.bg||CREAM,color:STAGE_STYLE[data.stage]?.color||NAVY,fontWeight:700,border:"none",cursor:"pointer"}}>
                {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(245,240,234,0.5)",fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>
          </div>
        </div>
        <div style={{padding:"26px 36px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:22}}>
            <div>
              <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,fontWeight:700,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${CREAM}`}}>Contact</div>
              {[{k:"contact",p:"Prénom Nom"},{k:"email",p:"email@restaurant.fr"},{k:"tel",p:"06 00 00 00 00"}].map(f=>(
                <div key={f.k} style={{marginBottom:10}}><label style={lS}>{f.k}</label><input value={data[f.k]||""} onChange={e=>set(f.k,e.target.value)} placeholder={f.p} style={iS}/></div>
              ))}
            </div>
            <div>
              <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,fontWeight:700,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${CREAM}`}}>Localisation</div>
              <div style={{marginBottom:10}}><label style={lS}>Adresse</label><input value={data.adresse||""} onChange={e=>set("adresse",e.target.value)} style={iS}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div><label style={lS}>Ville</label><input value={data.ville||""} onChange={e=>set("ville",e.target.value)} style={iS}/></div>
                <div><label style={lS}>CP</label><input value={data.cp||""} onChange={e=>set("cp",e.target.value)} style={iS}/></div>
              </div>
              <div><label style={lS}>Région</label>
                <select value={data.region||""} onChange={e=>set("region",e.target.value)} style={{...iS,background:WHITE,cursor:"pointer"}}>
                  <option value="">— Sélectionner —</option>
                  {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,fontWeight:700,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${CREAM}`}}>Données</div>
              <div style={{marginBottom:10}}><label style={lS}>Salariés</label><input type="number" value={data.salaries||""} onChange={e=>set("salaries",parseInt(e.target.value)||0)} style={iS}/></div>
              <div style={{background:NAVY,borderRadius:6,padding:"14px"}}>
                <div style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>CA</div>
                <div style={{fontSize:24,fontWeight:700,color:CREAM,fontFamily:"Georgia,serif"}}>{fmtEur(data.ca)}</div>
                {filled>0&&filled<12&&<div style={{fontSize:13,color:GOLD_L,marginTop:4}}>≈ {fmtEur(Math.round(data.ca/filled*12))} annualisé</div>}
                {data.ca>0&&<div style={{fontSize:12,color:"rgba(245,240,234,0.6)",marginTop:6}}>Gain LND : {Math.round(data.ca*0.08/1000)}k–{Math.round(data.ca*0.12/1000)}k€</div>}
              </div>
            </div>
          </div>
          {/* CA mensuel */}
          <div style={{background:CREAM,borderRadius:8,padding:"18px 22px",marginBottom:20}}>
            <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:NAVY,fontWeight:700,marginBottom:14}}>📊 CA mensuel</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:6}}>
              {MONTHS_S.map((m,i)=>(
                <div key={i}>
                  <div style={{fontSize:9,color:GOLD,fontWeight:700,textAlign:"center",marginBottom:4,letterSpacing:1}}>{m}</div>
                  <input type="number" min="0" value={data.caHistory[i]||""} onChange={e=>setCA(i,e.target.value)} placeholder="0" style={{width:"100%",padding:"7px 4px",borderRadius:4,border:`1px solid ${data.caHistory[i]>0?"rgba(184,150,62,0.4)":"rgba(27,42,74,0.15)"}`,fontSize:10,outline:"none",color:NAVY,background:data.caHistory[i]>0?"#fffbe8":WHITE,textAlign:"center",boxSizing:"border-box",fontWeight:data.caHistory[i]>0?600:400}}/>
                </div>
              ))}
            </div>
            {data.ca>0&&<div style={{marginTop:12,display:"flex",gap:20,alignItems:"center"}}>
              <Sparkline data={data.caHistory} width={180} height={32}/>
              <div style={{fontSize:13,fontWeight:700,color:NAVY}}>Total : {fmtEur(data.ca)}</div>
              {filled>0&&<div style={{fontSize:13,color:GOLD}}>Moy : {fmtEur(Math.round(data.ca/filled))}/mois</div>}
            </div>}
          </div>
          {/* Forfaits */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:NAVY,fontWeight:700}}>📋 Forfaits</div>
              {totalMensuel>0&&<div style={{background:NAVY,borderRadius:4,padding:"5px 12px",fontSize:13,fontWeight:700,color:GOLD,fontFamily:"Georgia,serif"}}>{totalMensuel.toLocaleString("fr-FR")} €/mois</div>}
            </div>
            {(data.forfaits||[]).length>0&&(
              <div style={{background:NAVY,borderRadius:8,padding:"14px 18px",marginBottom:12}}>
                <div style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Formules souscrites</div>
                {(data.forfaits||[]).map(f=>{
                  const opt=getOpt(f.optionId);
                  const forf=FORFAITS.find(ff=>ff.options.find(o=>o.id===f.optionId));
                  if(!opt||!forf) return null;
                  return (
                    <div key={f.optionId} style={{background:"rgba(255,255,255,0.07)",borderRadius:6,padding:"10px 12px",marginBottom:7,borderLeft:`3px solid ${GOLD}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:CREAM}}>{forf.icon} {forf.nom} — {opt.label}</div>
                          <div style={{fontSize:11,color:"rgba(245,240,234,0.45)"}}>{opt.detail}</div>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:14,fontWeight:700,color:GOLD,fontFamily:"Georgia,serif"}}>{opt.prix>0?`${opt.prix.toLocaleString("fr-FR")} €`:"Devis"}</span>
                          <button onClick={()=>removeForfait(f.optionId)} style={{background:"rgba(192,57,43,0.3)",border:"none",color:"#ff8a7a",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:12}}>✕</button>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <input type="date" value={f.dateDebut||""} onChange={e=>updForfait(f.optionId,"dateDebut",e.target.value)} style={{flex:"0 0 140px",padding:"6px 8px",borderRadius:4,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:CREAM,fontSize:11,outline:"none",boxSizing:"border-box"}}/>
                        <input value={f.notes||""} onChange={e=>updForfait(f.optionId,"notes",e.target.value)} placeholder="Notes..." style={{flex:1,padding:"6px 8px",borderRadius:4,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:CREAM,fontSize:11,outline:"none",boxSizing:"border-box"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {FORFAITS.map(forf=>(
                <div key={forf.id} style={{background:WHITE,borderRadius:7,overflow:"hidden",border:"1px solid rgba(27,42,74,0.09)"}}>
                  <div style={{padding:"10px 14px",background:forf.bg,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{forf.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:forf.color}}>{forf.nom}</div>
                    </div>
                  </div>
                  <div style={{padding:"7px 10px",display:"flex",flexDirection:"column",gap:4}}>
                    {forf.options.map(opt=>{
                      const active=!!(data.forfaits||[]).find(f=>f.optionId===opt.id);
                      return (
                        <div key={opt.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:5,border:`1px solid ${active?GOLD:"rgba(27,42,74,0.07)"}`,background:active?"#fffbe8":CREAM}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:600,color:NAVY}}>{opt.label}</div>
                            <div style={{fontSize:10,color:"#999"}}>{opt.detail}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,minWidth:80}}>
                            <div style={{fontSize:13,fontWeight:700,color:NAVY,fontFamily:"Georgia,serif"}}>{opt.prix>0?`${opt.prix.toLocaleString("fr-FR")} €`:"Devis"}</div>
                            {opt.prix>0&&<div style={{fontSize:10,color:"#aaa",fontFamily:"sans-serif"}}>/{opt.periode}</div>}
                          </div>
                          <button onClick={()=>active?removeForfait(opt.id):addForfait(opt.id)} style={{padding:"6px 12px",borderRadius:4,border:`1px solid ${active?RED:GOLD}`,background:active?"#fdeaea":"transparent",color:active?RED:GOLD,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                            {active?"Retirer":"+ Ajouter"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Notes */}
          <div style={{marginBottom:20}}>
            <label style={lS}>Notes libres</label>
            <textarea value={data.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Historique des échanges, contexte..." style={{...iS,resize:"vertical",minHeight:70,lineHeight:1.7}}/>
          </div>
          {/* Rappels */}
          <div style={{background:CREAM,borderRadius:8,padding:"18px 22px"}}>
            <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:NAVY,fontWeight:700,marginBottom:14}}>🔔 Rappels</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              {(data.rappels||[]).length===0&&<div style={{fontSize:12,color:"#bbb"}}>Aucun rappel</div>}
              {[...(data.rappels||[])].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>{
                const over=isOverdue(r.date),soon=isSoon(r.date);
                return (
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:WHITE,borderRadius:5,padding:"9px 12px",border:`1px solid ${over?"#f5c6c6":soon?"#fde8c6":"rgba(27,42,74,0.08)"}`,borderLeft:`3px solid ${over?RED:soon?ORANGE:GOLD}`}}>
                    <span>{over?"⚠":soon?"⏰":"📅"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:over?RED:NAVY}}>{fmtDate(r.date)}</div>
                      {r.note&&<div style={{fontSize:11,color:"#888"}}>{r.note}</div>}
                    </div>
                    <button onClick={()=>removeRappel(r.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:14}}>✕</button>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:"0 0 140px"}}><label style={lS}>Date</label><input type="date" value={newRDate} onChange={e=>setNewRDate(e.target.value)} style={{...iS,background:WHITE}}/></div>
              <div style={{flex:1}}><label style={lS}>Objet</label><input value={newRNote} onChange={e=>setNewRNote(e.target.value)} style={{...iS,background:WHITE}} placeholder="Relance, bilan..." onKeyDown={e=>e.key==="Enter"&&addRappel()}/></div>
              <button onClick={addRappel} style={{background:NAVY,color:CREAM,border:`1px solid ${GOLD}`,borderRadius:5,padding:"10px 14px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Ajouter</button>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            <button onClick={()=>onSave(data)} style={{flex:1,background:NAVY,color:CREAM,border:`1px solid ${GOLD}`,borderRadius:6,padding:13,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase"}}>Enregistrer</button>
            <button onClick={onClose} style={{flex:1,background:WHITE,color:NAVY,border:"1px solid rgba(27,42,74,0.2)",borderRadius:6,padding:13,fontSize:12,cursor:"pointer"}}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODULE RAPPORTS ───────────────────────────────────────────────────
function MiniChart({data, width=120, height=40, color=GOLD}) {
  const vals = data.filter(v => v > 0);
  if (vals.length < 2) return <div style={{width,height,display:"flex",alignItems:"center",justifyContent:"center",color:"#ddd",fontSize:11}}>—</div>;
  const max = Math.max(...data, 1), min = Math.min(...data.filter(v=>v>0));
  const range = max - min || 1;
  const W = width, H = height;
  const pts = data.map((v,i) => `${(i/(data.length-1))*W},${v>0?H-((v-min)/range)*(H-6)-3:H}`).join(" ");
  const filled = data.map((v,i) => `${(i/(data.length-1))*W},${v>0?H-((v-min)/range)*(H-6)-3:H}`).join(" ") + ` ${W},${H} 0,${H}`;
  const last = [...data].reverse().findIndex(v=>v>0);
  const lastIdx = data.length - 1 - last;
  const lx = (lastIdx/(data.length-1))*W;
  const ly = H-((data[lastIdx]-min)/range)*(H-6)-3;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <polygon fill={`rgba(184,150,62,0.1)`} points={filled}/>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <circle cx={lx} cy={ly} r="3.5" fill={color}/>
    </svg>
  );
}

function KPICard({label, value, sub, trend, accent=GOLD, chart, icon}) {
  const trendUp = trend > 0;
  return (
    <div style={{background:WHITE,borderRadius:10,padding:"20px 22px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)",borderTop:`3px solid ${accent}`,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{fontSize:9,color:"#aaa",letterSpacing:2,textTransform:"uppercase",fontWeight:600,fontFamily:"sans-serif"}}>{icon&&<span style={{marginRight:5}}>{icon}</span>}{label}</div>
        {trend!==undefined&&<div style={{fontSize:11,fontWeight:700,color:trendUp?GREEN:RED,fontFamily:"sans-serif"}}>{trendUp?"+":""}{trend}%</div>}
      </div>
      <div style={{fontSize:28,fontWeight:700,color:accent,letterSpacing:-1,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#bbb",fontFamily:"sans-serif"}}>{sub}</div>}
      {chart&&<div style={{marginTop:4}}>{chart}</div>}
    </div>
  );
}

function RapportSection({title, icon, children}) {
  return (
    <div style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:12,borderBottom:`1px solid ${CREAM}`}}>
        <span style={{fontSize:20}}>{icon}</span>
        <div style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,fontFamily:"sans-serif"}}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function ModuleRapports({restaurants, prospects, users, periode}) {
  const directors = users.filter(u=>u.role==="directeur");
  const MONTHS_OP_R = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const MONTH_LABELS_R = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  const getPeriodeMonths = () => {
    if (periode === "mensuel") return MONTHS_OP_R.slice(4, 5);
    if (periode === "trimestriel") return MONTHS_OP_R.slice(2, 5);
    return MONTHS_OP_R;
  };
  const periodeMonths = getPeriodeMonths();

  const sumCA = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).ca||0), 0);
  const sumMS = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).masseSalariale||0), 0);
  const sumCM = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).coutsMatieres||0), 0);
  const sumCF = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).chargesFixes||0), 0);
  const sumCouverts = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).couverts||0), 0);
  const sumTickets = (r) => periodeMonths.reduce((s,m) => s + ((r.months[m]||EMPTY_MONTH).tickets||0), 0);

  const activeRestos = restaurants.filter(r=>r.status==="actif");
  const totalCA = activeRestos.reduce((s,r)=>s+sumCA(r),0);
  const totalMS = activeRestos.reduce((s,r)=>s+sumMS(r),0);
  const totalCM = activeRestos.reduce((s,r)=>s+sumCM(r),0);
  const totalCF = activeRestos.reduce((s,r)=>s+sumCF(r),0);
  const totalEBE = totalCA-totalMS-totalCM-totalCF;
  const totalCouverts = activeRestos.reduce((s,r)=>s+sumCouverts(r),0);
  const totalTickets = activeRestos.reduce((s,r)=>s+sumTickets(r),0);
  const ratioMSGlobal = totalCA>0?(totalMS/totalCA*100):0;
  const ratioCMGlobal = totalCA>0?(totalCM/totalCA*100):0;
  const tauxEBE = totalCA>0?(totalEBE/totalCA*100):0;
  const ticketMoyenGlobal = totalTickets>0?totalCA/totalTickets:0;

  const caParMois = MONTHS_OP_R.map(m=>activeRestos.reduce((s,r)=>s+((r.months[m]||EMPTY_MONTH).ca||0),0));

  const valides = prospects.filter(r=>r.stage==="Validé").length;
  const tauxConversion = prospects.length>0?Math.round(valides/prospects.length*100):0;
  const revForfaits = prospects.filter(r=>r.stage==="Validé").reduce((s,r)=>s+(r.forfaits||[]).reduce((ss,f)=>{
    const o=FORFAITS.flatMap(ff=>ff.options).find(o=>o.id===f.optionId);
    return ss+(o&&o.periode==="mois"?o.prix:0);
  },0),0);
  const caPipeline = prospects.filter(r=>["Intéressé","Négo en cours","À relancer"].includes(r.stage)).reduce((s,r)=>s+(r.ca||0),0);

  const statsParDir = directors.map(d=>{
    const their=restaurants.filter(r=>r.directorId===d.id&&r.status==="actif");
    const ca=their.reduce((s,r)=>s+sumCA(r),0);
    const ms=their.reduce((s,r)=>s+sumMS(r),0);
    const cm=their.reduce((s,r)=>s+sumCM(r),0);
    const cf=their.reduce((s,r)=>s+sumCF(r),0);
    const ebe=ca-ms-cm-cf;
    return {dir:d,restos:their,ca,ms,cm,ebe,alerts:their.reduce((s,r)=>s+r.alerts.length,0),ratioMS:ca>0?ms/ca*100:0};
  });

  const classementCA=[...activeRestos].sort((a,b)=>sumCA(b)-sumCA(a)).map(r=>({
    resto:r,ca:sumCA(r),ms:sumMS(r),
    ebe:sumCA(r)-sumMS(r)-sumCM(r)-sumCF(r),
    ratioMS:sumCA(r)>0?sumMS(r)/sumCA(r)*100:0,
    dir:users.find(u=>u.id===r.directorId)?.name||"—",
  }));

  const fE=n=>n>=1000000?`${(n/1000000).toFixed(2)}M€`:n>=1000?`${(n/1000).toFixed(0)}k€`:n>0?`${n}€`:"—";
  const fP=n=>`${n.toFixed(1)}%`;
  const rC=(v,b,w)=>v===0?"#aaa":v>b?RED:v>w?ORANGE:GREEN;

  return (
    <div>
      {/* EN-TÊTE */}
      <div style={{marginBottom:32}}>
        <div style={{fontSize:9,letterSpacing:4,color:GOLD,textTransform:"uppercase",marginBottom:8,fontWeight:600,fontFamily:"sans-serif"}}>Tableau de bord exécutif</div>
        <h1 style={{fontSize:28,fontWeight:700,margin:0,letterSpacing:-0.5,fontFamily:"'Cormorant Garamond',serif"}}>Rapports & Analyses</h1>
        <div style={{width:36,height:2,background:GOLD,marginTop:9}}/>
        <div style={{fontSize:12,color:"#aaa",fontFamily:"sans-serif",marginTop:10}}>
          Période : <strong style={{color:NAVY}}>{periode==="mensuel"?"Mai 2024":periode==="trimestriel"?"T1 2024 (Mar–Mai)":"Annuel 2024"}</strong>
          {" · "}{activeRestos.length} établissement{activeRestos.length>1?"s":""} actif{activeRestos.length>1?"s":""}
          {" · "}{directors.length} directeur{directors.length>1?"s":""}
        </div>
      </div>

      {/* SYNTHÈSE GLOBALE */}
      <RapportSection title="Synthèse globale" icon="◈">
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:14}}>
          <KPICard label="CA total" value={fE(totalCA)} sub={`${activeRestos.length} restaurants actifs`} accent={GOLD} icon="€"
            chart={<MiniChart data={caParMois} color={GOLD} width={120} height={36}/>}/>
          <KPICard label="EBE" value={fE(totalEBE)} sub={`${fP(tauxEBE)} du CA`} accent={tauxEBE>10?GREEN:tauxEBE>5?ORANGE:RED} icon="📈"/>
          <KPICard label="Masse salariale" value={fE(totalMS)} sub={`Ratio global : ${fP(ratioMSGlobal)}`} accent={rC(ratioMSGlobal,40,35)} icon="👥"/>
          <KPICard label="Ticket moyen" value={fE(ticketMoyenGlobal)} sub={`${totalCouverts.toLocaleString("fr-FR")} couverts`} accent={NAVY} icon="🍽"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <KPICard label="Coûts matières" value={fE(totalCM)} sub={`Ratio : ${fP(ratioCMGlobal)}`} accent={rC(ratioCMGlobal,35,30)} icon="📦"/>
          <KPICard label="Marge brute" value={fE(totalCA-totalCM)} sub={`${fP(totalCA>0?(totalCA-totalCM)/totalCA*100:0)} du CA`} accent={totalCA>0&&(totalCA-totalCM)/totalCA>0.6?GREEN:ORANGE} icon="💹"/>
          <KPICard label="Charges fixes" value={fE(totalCF)} sub="Total établissements" accent={NAVY} icon="🏢"/>
          <KPICard label="Revenus LND/mois" value={revForfaits>0?`${revForfaits.toLocaleString("fr-FR")} €`:"—"} sub={`${valides} clients validés`} accent={GOLD} icon="📋"/>
        </div>
      </RapportSection>

      {/* RAPPORT OPÉRATIONNEL */}
      <RapportSection title="Rapport opérationnel" icon="⚙">
        {/* Graphe CA mensuel */}
        <div style={{background:WHITE,borderRadius:10,padding:"22px 24px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)",marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,marginBottom:18,fontFamily:"sans-serif"}}>Évolution CA mensuelle</div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
            {MONTHS_OP_R.map((m,i)=>{
              const v=caParMois[i];
              const maxV=Math.max(...caParMois,1);
              const h=v>0?Math.max((v/maxV)*72,4):0;
              const inPeriode=periodeMonths.includes(m);
              return (
                <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",height:72,display:"flex",alignItems:"flex-end"}}>
                    <div style={{width:"100%",height:h,borderRadius:"3px 3px 0 0",background:inPeriode?GOLD:"rgba(184,150,62,0.2)"}}/>
                  </div>
                  <div style={{fontSize:8,color:inPeriode?NAVY:"#bbb",fontFamily:"sans-serif",fontWeight:inPeriode?700:400}}>{MONTH_LABELS_R[i]}</div>
                  {v>0&&<div style={{fontSize:7,color:GOLD,fontFamily:"sans-serif",fontWeight:600}}>{v>=1000?`${(v/1000).toFixed(0)}k`:v}</div>}
                </div>
              );
            })}
          </div>
        </div>
        {/* Tableau restaurants */}
        <div style={{background:WHITE,borderRadius:10,overflow:"hidden",boxShadow:"0 2px 16px rgba(27,42,74,0.07)"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
              <thead>
                <tr style={{background:NAVY}}>
                  {["#","Restaurant","Directeur","CA","Ratio MS","EBE","Taux EBE","⚠"].map(h=>(
                    <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:9,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classementCA.map((row,i)=>(
                  <tr key={row.resto.id} style={{borderBottom:`1px solid ${CREAM}`,background:i%2===0?WHITE:"#fdfcfa"}}>
                    <td style={{padding:"11px 14px",fontSize:12,fontWeight:700,color:i<3?GOLD:"#bbb",fontFamily:"sans-serif"}}>{i+1}</td>
                    <td style={{padding:"11px 14px",fontWeight:700,fontSize:13}}>{row.resto.name}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:"#777",fontFamily:"sans-serif"}}>{row.dir}</td>
                    <td style={{padding:"11px 14px",fontWeight:700,color:NAVY,fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>{fE(row.ca)}</td>
                    <td style={{padding:"11px 14px"}}>
                      <span style={{fontSize:11,fontWeight:700,color:rC(row.ratioMS,40,35),fontFamily:"sans-serif",background:rC(row.ratioMS,40,35)===GREEN?"#e8f5ee":rC(row.ratioMS,40,35)===ORANGE?"#fff0e0":"#fdeaea",padding:"3px 8px",borderRadius:3}}>
                        {fP(row.ratioMS)}
                      </span>
                    </td>
                    <td style={{padding:"11px 14px",fontWeight:700,color:row.ebe>0?GREEN:RED,fontFamily:"sans-serif",fontSize:12}}>{fE(row.ebe)}</td>
                    <td style={{padding:"11px 14px",fontSize:11,fontWeight:700,color:row.ca>0?(row.ebe/row.ca*100>10?GREEN:row.ebe/row.ca*100>5?ORANGE:RED):"#ddd",fontFamily:"sans-serif"}}>
                      {row.ca>0?fP(row.ebe/row.ca*100):"—"}
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      {row.resto.alerts.length>0
                        ?<span style={{fontSize:10,background:"#fdf8f0",color:ORANGE,fontWeight:700,padding:"3px 7px",borderRadius:3,fontFamily:"sans-serif"}}>⚠ {row.resto.alerts.length}</span>
                        :<span style={{fontSize:11,color:GREEN}}>✓</span>}
                    </td>
                  </tr>
                ))}
                <tr style={{background:NAVY}}>
                  <td colSpan={3} style={{padding:"12px 14px",fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"sans-serif"}}>TOTAL</td>
                  <td style={{padding:"12px 14px",fontWeight:700,color:CREAM,fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>{fE(totalCA)}</td>
                  <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:700,color:rC(ratioMSGlobal,40,35),fontFamily:"sans-serif"}}>{fP(ratioMSGlobal)}</span></td>
                  <td style={{padding:"12px 14px",fontWeight:700,color:totalEBE>0?GREEN:RED,fontFamily:"sans-serif",fontSize:12}}>{fE(totalEBE)}</td>
                  <td style={{padding:"12px 14px",fontWeight:700,color:tauxEBE>10?GREEN:tauxEBE>5?ORANGE:RED,fontFamily:"sans-serif",fontSize:12}}>{fP(tauxEBE)}</td>
                  <td style={{padding:"12px 14px",color:GOLD,fontSize:11}}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </RapportSection>

      {/* RAPPORT DIRECTEURS */}
      <RapportSection title="Performance par directeur" icon="◉">
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
          {statsParDir.map(({dir,restos,ca,ms,ebe,alerts,ratioMS})=>(
            <div key={dir.id} style={{background:WHITE,borderRadius:10,padding:"22px 24px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)",borderLeft:`4px solid ${ratioMS>40?RED:ratioMS>35?ORANGE:GOLD}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:42,height:42,borderRadius:"50%",background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:GOLD,fontFamily:"sans-serif",flexShrink:0}}>{dir.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700}}>{dir.name}</div>
                  <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{restos.length} restaurant{restos.length>1?"s":""} actif{restos.length>1?"s":""}</div>
                </div>
                {alerts>0&&<div style={{fontSize:10,background:"#fdf8f0",color:ORANGE,fontWeight:700,padding:"4px 10px",borderRadius:4,fontFamily:"sans-serif"}}>⚠ {alerts}</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {[{l:"CA",v:fE(ca),c:GOLD},{l:"EBE",v:fE(ebe),c:ebe>0?GREEN:RED},{l:"Ratio MS",v:fP(ratioMS),c:rC(ratioMS,40,35)}].map(f=>(
                  <div key={f.l} style={{background:CREAM,borderRadius:6,padding:"9px 11px"}}>
                    <div style={{fontSize:9,color:"#aaa",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"sans-serif",marginBottom:3}}>{f.l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:f.c,fontFamily:"'Cormorant Garamond',serif"}}>{f.v}</div>
                  </div>
                ))}
              </div>
              {restos.map(r=>{
                const rca=sumCA(r),rms=sumMS(r),rebe=rca-rms-sumCM(r)-sumCF(r);
                return (
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${CREAM}`}}>
                    <div style={{fontSize:12,fontWeight:600}}>{r.name}</div>
                    <div style={{display:"flex",gap:10}}>
                      <span style={{fontSize:12,fontWeight:700,color:NAVY,fontFamily:"'Cormorant Garamond',serif"}}>{fE(rca)}</span>
                      <span style={{fontSize:10,fontWeight:700,color:rebe>0?GREEN:RED,fontFamily:"sans-serif"}}>{fE(rebe)} EBE</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </RapportSection>

      {/* RAPPORT COMMERCIAL */}
      <RapportSection title="Rapport commercial" icon="💼">
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          <KPICard label="Total prospects" value={prospects.length} sub="dans le CRM" accent={NAVY} icon="📊"/>
          <KPICard label="Clients validés" value={valides} sub={`${tauxConversion}% taux de conversion`} accent={GREEN} icon="✓"/>
          <KPICard label="Rev. récurrents" value={revForfaits>0?`${revForfaits.toLocaleString("fr-FR")} €/mois`:"—"} sub={`≈ ${(revForfaits*12/1000).toFixed(0)}k€/an`} accent={GOLD} icon="📋"/>
          <KPICard label="Pipeline potentiel" value={fE(caPipeline)} sub="CA prospects actifs" accent={ORANGE} icon="🎯"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {/* Répartition pipeline */}
          <div style={{background:WHITE,borderRadius:10,padding:"22px 24px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,marginBottom:16,fontFamily:"sans-serif"}}>Répartition pipeline</div>
            {STAGES.map(stage=>{
              const count=prospects.filter(r=>r.stage===stage).length;
              const pct=prospects.length>0?count/prospects.length*100:0;
              const sc=STAGE_STYLE[stage];
              return (
                <div key={stage} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:sc.dot,display:"inline-block",flexShrink:0}}/>
                      <span style={{fontSize:12,fontFamily:"sans-serif",color:NAVY}}>{stage}</span>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <span style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{count}</span>
                      <span style={{fontSize:11,fontWeight:700,color:sc.color,fontFamily:"sans-serif",minWidth:30,textAlign:"right"}}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div style={{height:4,background:CREAM,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:sc.dot,borderRadius:2}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Forfaits */}
          <div style={{background:WHITE,borderRadius:10,padding:"22px 24px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:NAVY,marginBottom:16,fontFamily:"sans-serif"}}>Forfaits actifs</div>
            {FORFAITS.map(forf=>{
              const optStats=forf.options.map(opt=>{const nb=prospects.filter(r=>(r.forfaits||[]).find(f=>f.optionId===opt.id)).length;return {...opt,nb,rev:opt.periode==="mois"?nb*opt.prix:0};}).filter(o=>o.nb>0);
              const totalRev=optStats.reduce((s,o)=>s+o.rev,0);
              if(optStats.length===0) return null;
              return (
                <div key={forf.id} style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${CREAM}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:forf.color,fontFamily:"sans-serif"}}>{forf.icon} {forf.nom}</div>
                    {totalRev>0&&<div style={{fontSize:11,fontWeight:700,color:GOLD,fontFamily:"sans-serif"}}>{totalRev.toLocaleString("fr-FR")} €/mois</div>}
                  </div>
                  {optStats.map(opt=>(
                    <div key={opt.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",padding:"2px 0",fontFamily:"sans-serif"}}>
                      <span>{opt.label}</span>
                      <span style={{fontWeight:600,color:NAVY}}>{opt.nb} client{opt.nb>1?"s":""}{opt.rev>0?` · ${opt.rev.toLocaleString("fr-FR")} €/mois`:""}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{paddingTop:10,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,fontWeight:700,color:NAVY,fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1}}>Total récurrent</span>
              <span style={{fontSize:16,fontWeight:700,color:GOLD,fontFamily:"'Cormorant Garamond',serif"}}>{revForfaits.toLocaleString("fr-FR")} €/mois</span>
            </div>
          </div>
        </div>
      </RapportSection>

      {/* KPIs CONSULTING */}
      <RapportSection title="KPIs Consulting LND" icon="🎯">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
          {[
            {label:"Charge moyenne / directeur",val:directors.length>0?`${Math.round(activeRestos.length/directors.length*10)/10} resto/dir.`:"—",desc:"Nombre de restaurants par directeur",accent:GOLD},
            {label:"Gain estimé généré",val:totalCA>0?fE(Math.round(totalCA*0.1)):"—",desc:"Estimation 10% du CA géré",accent:GREEN},
            {label:"Taux de conversion",val:`${tauxConversion}%`,desc:"Prospects convertis en clients",accent:NAVY},
            {label:"ARR (revenu annuel récurrent)",val:revForfaits>0?fE(revForfaits*12):"—",desc:"Projeté sur 12 mois",accent:GOLD},
            {label:"Alertes ratios actives",val:activeRestos.reduce((s,r)=>s+r.alerts.length,0)||"✓",desc:"Ratios hors normes détectés",accent:activeRestos.reduce((s,r)=>s+r.alerts.length,0)>0?RED:GREEN},
            {label:"Restaurants en croissance",val:activeRestos.filter(r=>{const v=MONTHS_OP_R.map(m=>(r.months[m]||EMPTY_MONTH).ca||0).filter(x=>x>0);return v.length>1&&v[v.length-1]>v[0];}).length,desc:"CA en hausse sur la période",accent:GREEN},
          ].map((k,i)=>(
            <div key={i} style={{background:WHITE,borderRadius:10,padding:"20px 22px",boxShadow:"0 2px 16px rgba(27,42,74,0.07)",borderLeft:`4px solid ${k.accent}`}}>
              <div style={{fontSize:9,color:"#aaa",letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:8,fontFamily:"sans-serif"}}>{k.label}</div>
              <div style={{fontSize:26,fontWeight:700,color:k.accent,letterSpacing:-0.5,fontFamily:"'Cormorant Garamond',serif",marginBottom:5}}>{k.val}</div>
              <div style={{fontSize:11,color:"#bbb",fontFamily:"sans-serif"}}>{k.desc}</div>
            </div>
          ))}
        </div>
      </RapportSection>
    </div>
  );
}

// ── VUE RAPPELS COMMERCIAL ────────────────────────────────────────────
function SecRappel({title,items,col,ico,onOpen,prospects}) {
  if(items.length===0) return null;
  return (
    <div style={{marginBottom:26}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:col,marginBottom:11,fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:7}}>
        {ico} {title} <span style={{fontWeight:400,color:"#bbb"}}>({items.length})</span>
      </div>
      {items.map(r=>(
        <div key={r.id} onClick={()=>onOpen(prospects.find(p=>p.id===r.restoId))} style={{display:"flex",alignItems:"center",gap:13,padding:"11px 15px",background:WHITE,borderRadius:5,marginBottom:5,border:"1px solid rgba(27,42,74,0.06)",borderLeft:`3px solid ${col}`,cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.background=CREAM}
          onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
          <div style={{flex:"0 0 100px",fontSize:12,fontWeight:600,color:col,fontFamily:"sans-serif"}}>{fmtDate(r.date)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{r.restoNom}</div>
            {r.note&&<div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{r.note}</div>}
          </div>
          <StageBadge stage={r.restoStage}/>
        </div>
      ))}
    </div>
  );
}

function VueRappelsCom({prospects, onOpen}) {
  const today=new Date();
  const in7=new Date(); in7.setDate(today.getDate()+7);
  const in30=new Date(); in30.setDate(today.getDate()+30);
  const all=prospects.flatMap(r=>(r.rappels||[]).map(rap=>({...rap,restoId:r.id,restoNom:r.nom,restoStage:r.stage}))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const overdue=all.filter(r=>new Date(r.date)<today);
  const week=all.filter(r=>new Date(r.date)>=today&&new Date(r.date)<=in7);
  const month=all.filter(r=>new Date(r.date)>in7&&new Date(r.date)<=in30);
  const later=all.filter(r=>new Date(r.date)>in30);

  return (
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:10,letterSpacing:4,color:GOLD,textTransform:"uppercase",marginBottom:8,fontWeight:600,fontFamily:"sans-serif"}}>Agenda</div>
        <h1 style={{fontSize:26,fontWeight:700,margin:0,fontFamily:"'Cormorant Garamond',serif"}}>Liste de rappels</h1>
        <div style={{width:36,height:2,background:GOLD,marginTop:9}}/>
      </div>
      {all.length===0&&<div style={{color:"#bbb",fontFamily:"sans-serif"}}>Aucun rappel programmé.</div>}
      <SecRappel title="En retard" items={overdue} col={RED} ico="⚠" onOpen={onOpen} prospects={prospects}/>
      <SecRappel title="Cette semaine" items={week} col={ORANGE} ico="⏰" onOpen={onOpen} prospects={prospects}/>
      <SecRappel title="Ce mois-ci" items={month} col={GOLD} ico="📅" onOpen={onOpen} prospects={prospects}/>
      <SecRappel title="Plus tard" items={later} col="#aaa" ico="🗓" onOpen={onOpen} prospects={prospects}/>
    </div>
  );
}

// ── APP PRINCIPALE ────────────────────────────────────────────────────
export default function LNDUnifie() {
  const [currentUser,setCurrentUser]=useState(null);

  // OPÉRATIONNEL state
  const [users,setUsers]=useState(USERS_ALL);
  const [restaurants,setRestaurants]=useState(INIT_RESTAURANTS_OP);
  const [opView,setOpView]=useState("dashboard");
  const [opSelected,setOpSelected]=useState(null);
  const [opTab,setOpTab]=useState("exploitation");
  const [showSaisie,setShowSaisie]=useState(false);
  const [showAddDir,setShowAddDir]=useState(false);
  const [showAddResto,setShowAddResto]=useState(false);
  const [newDir,setNewDir]=useState({name:"",email:"",password:""});
  const [newResto,setNewResto]=useState({name:"",contact:"",email:"",phone:"",caisse:"Lightspeed",status:"actif",stage:"Onboarding",directorId:""});
  const [opNote,setOpNote]=useState("");
  const [opTask,setOpTask]=useState("");
  const [showOpNote,setShowOpNote]=useState(false);
  const [showOpTask,setShowOpTask]=useState(false);

  // COMMERCIAL state
  const [prospects,setProspects]=useState(INIT_PROSPECTS);
  const [comView,setComView]=useState("pipeline");
  const [comSelected,setComSelected]=useState(null);
  const [showNewProspect,setShowNewProspect]=useState(false);
  const [comSearch,setComSearch]=useState("");
  const [comFilterStage,setComFilterStage]=useState("Tous");

  // MODULE (président : op | commercial | rapport)
  const [module,setModule]=useState("op");
  const [periodeRapport,setPeriodeRapport]=useState("mensuel");

  // ── TOUS LES useMemo DOIVENT ÊTRE AVANT TOUT RETURN CONDITIONNEL ──
  const filteredProspects=useMemo(()=>prospects.filter(r=>{
    const q=comSearch.toLowerCase();
    return(!q||r.nom.toLowerCase().includes(q)||(r.contact||"").toLowerCase().includes(q))&&(comFilterStage==="Tous"||r.stage===comFilterStage);
  }),[prospects,comSearch,comFilterStage]);
  const byStage=useMemo(()=>Object.fromEntries(STAGES.map(s=>[s,filteredProspects.filter(r=>r.stage===s)])),[filteredProspects]);
  const comStats=useMemo(()=>({
    total:prospects.length,
    valides:prospects.filter(r=>r.stage==="Validé").length,
    revForfaits:prospects.filter(r=>r.stage==="Validé").reduce((s,r)=>s+(r.forfaits||[]).reduce((ss,f)=>{const o=FORFAITS.flatMap(ff=>ff.options).find(o=>o.id===f.optionId);return ss+(o&&o.periode==="mois"?o.prix:0);},0),0),
    rappelsUrgents:prospects.flatMap(r=>(r.rappels||[]).filter(rap=>isOverdue(rap.date)||isSoon(rap.date))).length,
  }),[prospects]);
  const visibleRestosAll=useMemo(()=>!currentUser?[]:currentUser.role==="president"?restaurants:restaurants.filter(r=>r.directorId===currentUser.id),[restaurants,currentUser]);
  const opStats=useMemo(()=>({
    active:visibleRestosAll.filter(r=>r.status==="actif").length,
    alerts:visibleRestosAll.reduce((s,r)=>s+r.alerts.length,0),
    totalCA:visibleRestosAll.filter(r=>r.status==="actif").reduce((s,r)=>s+((r.months.may||EMPTY_MONTH).ca||0),0),
  }),[visibleRestosAll]);

  // ── LOGIN — après tous les hooks ──
  if(!currentUser) return <LoginScreen onLogin={u=>setCurrentUser(u)}/>;

  // Routing selon rôle
  const isPresident=currentUser.role==="president";
  const isCommercial=currentUser.role==="commercial";
  const isDirecteur=currentUser.role==="directeur";

  // Données opé filtrées selon rôle (alias post-login)
  const visibleRestos=visibleRestosAll;
  const directors=users.filter(u=>u.role==="directeur");

  function updateResto(updated) {
    setRestaurants(r=>r.map(x=>x.id===updated.id?updated:x));
    setOpSelected(updated);
  }
  function saveMonthData(month,data) {
    const ratios=calcRatios(data);
    const alerts=[];
    if(ratios.ratioMS>40) alerts.push(`Masse sal. > 40% du CA (${fmtPct(ratios.ratioMS)})`);
    if(ratios.ratioCM>30) alerts.push(`Coûts matières > 30% du CA (${fmtPct(ratios.ratioCM)})`);
    if(ratios.tauxEBE<5&&data.ca>0) alerts.push(`EBE faible : ${fmtPct(ratios.tauxEBE)}`);
    updateResto({...opSelected,months:{...opSelected.months,[month]:data},alerts});
  }
  function addNote(){if(!opNote.trim())return;updateResto({...opSelected,notes:[{date:new Date().toISOString().slice(0,10),text:opNote},...opSelected.notes]});setOpNote("");setShowOpNote(false);}
  function addTask(){if(!opTask.trim())return;updateResto({...opSelected,tasks:[...opSelected.tasks,{id:Date.now(),text:opTask,done:false,due:""}]});setOpTask("");setShowOpTask(false);}
  function toggleTask(id){updateResto({...opSelected,tasks:opSelected.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});}

  function saveProspect(data){
    if(data.id) setProspects(p=>p.map(x=>x.id===data.id?data:x));
    else setProspects(p=>[{...data,id:Date.now()},...p]);
    setComSelected(null);setShowNewProspect(false);
  }

  const iS2={width:"100%",padding:"10px 13px",borderRadius:5,border:"1px solid rgba(27,42,74,0.18)",fontSize:13,outline:"none",color:NAVY,background:WHITE,boxSizing:"border-box"};
  const lS2={fontSize:9,letterSpacing:2.5,textTransform:"uppercase",color:GOLD,fontWeight:700,display:"block",marginBottom:5};
  const bP={background:NAVY,color:CREAM,border:`1px solid ${GOLD}`,borderRadius:6,padding:"10px 18px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"};
  const bS={background:CREAM,color:NAVY,border:"1px solid rgba(27,42,74,0.2)",borderRadius:6,padding:"10px 18px",fontSize:11,cursor:"pointer"};

  // ── MODULE ──
  const showCommercialModule = isCommercial || (isPresident && module==="commercial");
  const showRapportModule = isPresident && module==="rapport";

  // ── SIDEBAR CONFIG ──
  const opNavItems = isPresident
    ?[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"directors",icon:"◉",label:"Directeurs"},{id:"list",icon:"≡",label:"Restaurants"}]
    :[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"list",icon:"≡",label:"Mes restaurants"}];
  const comNavItems=[
    {id:"pipeline",icon:"◈",label:"Pipeline"},
    {id:"forfaits",icon:"📋",label:"Forfaits"},
    {id:"ca",icon:"€",label:"CA & Classement"},
    {id:"table",icon:"≡",label:"Vue tableau"},
    {id:"rappels",icon:"🔔",label:"Rappels"},
  ];
  const activeNavItems=showRapportModule
    ?[{id:"mensuel",icon:"📅",label:"Mensuel"},{id:"trimestriel",icon:"📆",label:"Trimestriel"},{id:"annuel",icon:"🗓",label:"Annuel"}]
    :showCommercialModule?comNavItems:opNavItems;
  const activeView=showRapportModule?periodeRapport:showCommercialModule?comView:opView;
  const setActiveView=showRapportModule?setPeriodeRapport:showCommercialModule?setComView:setOpView;

  return (
    <div style={{fontFamily:"Georgia,serif",background:CREAM,minHeight:"100vh",color:NAVY,display:"flex"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');`}</style>

      {/* ── SIDEBAR ── */}
      <div style={{width:230,background:NAVY,display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"26px 24px 20px",borderBottom:"1px solid rgba(184,150,62,0.2)"}}>
          <div style={{fontSize:36,fontWeight:700,color:CREAM,letterSpacing:-1.5,lineHeight:1,fontFamily:"'Cormorant Garamond',Georgia,serif"}}>LND</div>
          <div style={{fontSize:8,letterSpacing:3,color:GOLD,textTransform:"uppercase",marginTop:4,fontWeight:700,fontFamily:"sans-serif"}}>
            {showRapportModule?"Rapports":showCommercialModule?"CRM Commercial":"CRM Opérationnel"}
          </div>
        </div>
        {/* User */}
        <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(184,150,62,0.12)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:NAVY,flexShrink:0,fontFamily:"sans-serif"}}>{currentUser.avatar}</div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:CREAM,fontFamily:"sans-serif"}}>{currentUser.name}</div>
            <div style={{fontSize:9,color:GOLD,fontFamily:"sans-serif",letterSpacing:1}}>{currentUser.role==="president"?"Président":currentUser.role==="commercial"?"Dir. Commerciale":"Directeur"}</div>
          </div>
        </div>

        {/* Switch module (président seulement) */}
        {isPresident&&(
          <div style={{padding:"10px 10px",borderBottom:"1px solid rgba(184,150,62,0.12)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3}}>
              {[{id:"op",label:"Opérat.",icon:"⚙"},{id:"commercial",label:"Com.",icon:"💼"},{id:"rapport",label:"Rapports",icon:"📊"}].map(m=>(
                <button key={m.id} onClick={()=>setModule(m.id)} style={{padding:"7px 4px",borderRadius:5,border:`1px solid ${module===m.id?GOLD:"rgba(184,150,62,0.2)"}`,background:module===m.id?"rgba(184,150,62,0.18)":"transparent",color:module===m.id?GOLD:"rgba(245,240,234,0.45)",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif",textAlign:"center",lineHeight:1.4}}>
                  <div>{m.icon}</div><div>{m.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <nav style={{padding:"12px 10px",flex:1}}>
          {activeNavItems.map(item=>(
            <button key={item.id} onClick={()=>setActiveView(item.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"11px 14px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"sans-serif",fontSize:12,fontWeight:600,marginBottom:2,textAlign:"left",background:activeView===item.id?"rgba(184,150,62,0.15)":"transparent",color:activeView===item.id?GOLD:"rgba(245,240,234,0.5)",borderLeft:activeView===item.id?`3px solid ${GOLD}`:"3px solid transparent"}}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(184,150,62,0.15)"}}>
          {showCommercialModule
            ?<>
              <div style={{fontSize:11,color:"rgba(245,240,234,0.4)",marginBottom:2,fontFamily:"sans-serif"}}>{comStats.valides} clients actifs</div>
              {comStats.revForfaits>0&&<div style={{fontSize:11,color:GOLD_L,marginBottom:2,fontFamily:"sans-serif"}}>📋 {comStats.revForfaits.toLocaleString("fr-FR")} €/mois</div>}
              {comStats.rappelsUrgents>0&&<div style={{fontSize:11,color:RED,marginBottom:4,fontFamily:"sans-serif"}}>⚠ {comStats.rappelsUrgents} rappel{comStats.rappelsUrgents>1?"s":""}</div>}
            </>
            :<>
              <div style={{fontSize:11,color:"rgba(245,240,234,0.4)",marginBottom:2,fontFamily:"sans-serif"}}>{opStats.active} restaurants actifs</div>
              {opStats.alerts>0&&<div style={{fontSize:11,color:GOLD,marginBottom:2,fontFamily:"sans-serif"}}>⚠ {opStats.alerts} alerte{opStats.alerts>1?"s":""}</div>}
            </>
          }
          <button onClick={()=>setCurrentUser(null)} style={{fontSize:11,color:"rgba(245,240,234,0.3)",background:"none",border:"none",cursor:"pointer",fontFamily:"sans-serif",padding:0,marginTop:4}}>← Déconnexion</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,padding:"32px 36px",overflowY:"auto",minWidth:0}}>

        {/* ══════════════ MODULE RAPPORTS ══════════════ */}
        {showRapportModule&&(
          <ModuleRapports
            restaurants={restaurants}
            prospects={prospects}
            users={users}
            periode={periodeRapport}
          />
        )}

        {/* ══════════════ MODULE OPÉRATIONNEL ══════════════ */}
        {!showCommercialModule&&!showRapportModule&&(
          <>
            {/* Top bar op */}
            {opView!=="detail"&&(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:4,color:GOLD,textTransform:"uppercase",marginBottom:7,fontWeight:600,fontFamily:"sans-serif"}}>
                    {opView==="dashboard"?"Vue globale":opView==="directors"?"Équipe":"Portefeuille"}
                  </div>
                  <h1 style={{fontSize:28,fontWeight:700,margin:0,letterSpacing:-0.5,fontFamily:"'Cormorant Garamond',Georgia,serif"}}>
                    {opView==="dashboard"?"Dashboard":opView==="directors"?"Directeurs":"Restaurants"}
                  </h1>
                  <div style={{width:36,height:2,background:GOLD,marginTop:8}}/>
                </div>
                {isPresident&&opView==="list"&&<button onClick={()=>setShowAddResto(true)} style={bP}>+ Nouveau restaurant</button>}
                {isPresident&&opView==="directors"&&<button onClick={()=>setShowAddDir(true)} style={bP}>+ Nouveau directeur</button>}
              </div>
            )}

            {/* DASHBOARD OP */}
            {opView==="dashboard"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
                  {[
                    {label:"CA total (mai)",val:fmtEur(opStats.totalCA),accent:GOLD},
                    {label:"Restaurants actifs",val:opStats.active,accent:NAVY2},
                    {label:isPresident?"Directeurs":"Tâches en attente",val:isPresident?directors.length:visibleRestos.flatMap(r=>r.tasks.filter(t=>!t.done)).length,accent:GOLD},
                    {label:"Alertes actives",val:opStats.alerts,accent:opStats.alerts>0?RED:GREEN},
                  ].map((k,i)=>(
                    <div key={i} style={{background:WHITE,borderRadius:8,padding:"20px 22px",boxShadow:"0 2px 12px rgba(27,42,74,0.08)",borderTop:`3px solid ${k.accent}`}}>
                      <div style={{fontSize:9,color:"#aaa",letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:7,fontFamily:"sans-serif"}}>{k.label}</div>
                      <div style={{fontSize:30,fontWeight:700,color:k.accent,letterSpacing:-1,fontFamily:"'Cormorant Garamond',serif"}}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div style={{background:WHITE,borderRadius:8,padding:22,boxShadow:"0 2px 12px rgba(27,42,74,0.08)"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:NAVY,marginBottom:14,fontFamily:"sans-serif"}}>Performances (mai)</div>
                    {visibleRestos.filter(r=>r.status==="actif").map(r=>{
                      const d=r.months.may||EMPTY_MONTH;
                      const ratios=calcRatios(d);
                      return (
                        <div key={r.id} onClick={()=>{setOpSelected(r);setOpView("detail");setOpTab("exploitation");}} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${CREAM}`,cursor:"pointer"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:13}}>{r.name}</div>
                            {isPresident&&<div style={{fontSize:11,color:GOLD,fontFamily:"sans-serif"}}>{users.find(u=>u.id===r.directorId)?.name}</div>}
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700,fontSize:14}}>{fmtEur(d.ca)}</div>
                            <div style={{fontSize:11,fontFamily:"sans-serif",color:ratioColor(ratios.ratioMS,{bad:40,warn:35})}}>MS {fmtPct(ratios.ratioMS)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{background:WHITE,borderRadius:8,padding:22,boxShadow:"0 2px 12px rgba(27,42,74,0.08)"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:NAVY,marginBottom:14,fontFamily:"sans-serif"}}>⚠ Alertes</div>
                    {visibleRestos.flatMap(r=>r.alerts.map(a=>({a,r}))).length===0
                      ?<div style={{color:"#bbb",fontSize:13,fontFamily:"sans-serif"}}>Aucune alerte — ratios dans les normes ✓</div>
                      :visibleRestos.flatMap(r=>r.alerts.map(a=>({a,r}))).map((item,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fdf8f0",borderRadius:6,marginBottom:7,borderLeft:`3px solid ${GOLD}`}}>
                          <div style={{flex:1,fontFamily:"sans-serif"}}>
                            <span style={{fontWeight:700,fontSize:13}}>{item.r.name}</span>
                            <span style={{fontSize:12,color:"#7a5000",marginLeft:8}}>{item.a}</span>
                          </div>
                          <button onClick={()=>{setOpSelected(item.r);setOpView("detail");setOpTab("exploitation");}} style={{fontSize:11,color:GOLD,background:"none",border:"none",cursor:"pointer",fontFamily:"sans-serif",fontWeight:600}}>Voir →</button>
                        </div>
                      ))
                    }
                  </div>
                  {isPresident&&(
                    <div style={{background:WHITE,borderRadius:8,padding:22,boxShadow:"0 2px 12px rgba(27,42,74,0.08)",gridColumn:"1/-1"}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:NAVY,marginBottom:14,fontFamily:"sans-serif"}}>Directeurs</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                        {directors.map(d=>{
                          const their=restaurants.filter(r=>r.directorId===d.id);
                          const ca=their.filter(r=>r.status==="actif").reduce((s,r)=>s+((r.months.may||EMPTY_MONTH).ca||0),0);
                          return (
                            <div key={d.id} style={{background:CREAM,borderRadius:6,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                              <div style={{width:36,height:36,borderRadius:"50%",background:NAVY2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:GOLD,fontFamily:"sans-serif",flexShrink:0}}>{d.avatar}</div>
                              <div>
                                <div style={{fontWeight:700,fontSize:13}}>{d.name}</div>
                                <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{their.length} resto · {fmtEur(ca)}/mois</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LISTE DIRECTEURS */}
            {opView==="directors"&&isPresident&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {directors.map(d=>{
                  const their=restaurants.filter(r=>r.directorId===d.id);
                  const ca=their.filter(r=>r.status==="actif").reduce((s,r)=>s+((r.months.may||EMPTY_MONTH).ca||0),0);
                  return (
                    <div key={d.id} style={{background:WHITE,borderRadius:8,padding:22,boxShadow:"0 2px 12px rgba(27,42,74,0.08)",borderTop:`3px solid ${GOLD}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                        <div style={{width:42,height:42,borderRadius:"50%",background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:GOLD,fontFamily:"sans-serif"}}>{d.avatar}</div>
                        <div><div style={{fontWeight:700,fontSize:15}}>{d.name}</div><div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{d.email}</div></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {[{l:"Restaurants",v:their.length},{l:"Actifs",v:their.filter(r=>r.status==="actif").length},{l:"CA mai",v:fmtEur(ca)},{l:"Alertes",v:their.reduce((s,r)=>s+r.alerts.length,0)}].map(f=>(
                          <div key={f.l} style={{background:CREAM,borderRadius:5,padding:"9px 11px"}}>
                            <div style={{fontSize:9,color:"#aaa",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"sans-serif",marginBottom:2}}>{f.l}</div>
                            <div style={{fontSize:17,fontWeight:700}}>{f.v}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>setUsers(users.filter(u=>u.id!==d.id))} style={{...bS,width:"100%",textAlign:"center",color:RED,borderColor:"#f5c6c6",padding:"8px",fontSize:11}}>Supprimer</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LISTE RESTAURANTS */}
            {opView==="list"&&(
              <div style={{background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(27,42,74,0.07)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:NAVY}}>
                      {["Restaurant",isPresident?"Directeur":"Contact","Caisse","Statut","CA Mai","Ratio MS","EBE","Tendance"].map(h=>(
                        <th key={h} style={{padding:"13px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"sans-serif"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRestos.map(r=>{
                      const d=r.months.may||EMPTY_MONTH;
                      const ratios=calcRatios(d);
                      const sc={actif:{bg:"#e8f0e0",text:"#2d5a1b",label:"Actif"},prospect:{bg:"#fdf3dc",text:"#92400e",label:"Prospect"},inactif:{bg:"#f3f4f6",text:"#6b7280",label:"Inactif"}}[r.status]||{};
                      return (
                        <tr key={r.id} onClick={()=>{setOpSelected(r);setOpView("detail");setOpTab("exploitation");}} style={{borderBottom:`1px solid ${CREAM}`,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background=CREAM}
                          onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
                          <td style={{padding:"13px 16px",fontWeight:700,fontSize:14}}>{r.name}</td>
                          <td style={{padding:"13px 16px",fontSize:13,color:"#666",fontFamily:"sans-serif"}}>{isPresident?users.find(u=>u.id===r.directorId)?.name:r.contact}</td>
                          <td style={{padding:"13px 16px",fontSize:12,color:"#aaa",fontFamily:"sans-serif"}}>{r.caisse}</td>
                          <td style={{padding:"13px 16px"}}><span style={{background:sc.bg,color:sc.text,padding:"3px 9px",borderRadius:3,fontSize:10,fontWeight:700,fontFamily:"sans-serif",textTransform:"uppercase"}}>{sc.label}</span></td>
                          <td style={{padding:"13px 16px",fontWeight:700}}>{d.ca?fmtEur(d.ca):"—"}</td>
                          <td style={{padding:"13px 16px",fontWeight:700,fontFamily:"sans-serif",color:d.ca?ratioColor(ratios.ratioMS,{bad:40,warn:35}):"#ddd"}}>{d.ca?fmtPct(ratios.ratioMS):"—"}</td>
                          <td style={{padding:"13px 16px",fontWeight:700,fontFamily:"sans-serif",color:d.ca?(ratios.ebe>0?GREEN:RED):"#ddd"}}>{d.ca?fmtEur(ratios.ebe):"—"}</td>
                          <td style={{padding:"13px 16px"}}><SparklineOp data={r.months}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* DÉTAIL RESTAURANT */}
            {opView==="detail"&&opSelected&&(
              <div>
                <button onClick={()=>setOpView("list")} style={{background:"none",border:"none",color:GOLD,cursor:"pointer",fontSize:13,marginBottom:22,padding:0,fontFamily:"sans-serif",fontWeight:600}}>← Retour</button>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26}}>
                  <div>
                    <h1 style={{fontSize:24,fontWeight:700,margin:0,fontFamily:"'Cormorant Garamond',serif"}}>{opSelected.name}</h1>
                    <div style={{fontSize:13,color:"#888",fontFamily:"sans-serif",marginTop:4}}>{opSelected.contact} · {opSelected.email} · {opSelected.caisse}</div>
                    {isPresident&&<div style={{fontSize:12,color:GOLD,fontFamily:"sans-serif",marginTop:4,fontWeight:700}}>Dir. : {users.find(u=>u.id===opSelected.directorId)?.name}</div>}
                    <div style={{width:36,height:2,background:GOLD,marginTop:10}}/>
                  </div>
                  <button onClick={()=>setShowSaisie(true)} style={{...bP,fontSize:12,padding:"12px 20px"}}>✏ Saisir les chiffres</button>
                </div>
                {opSelected.alerts.length>0&&(
                  <div style={{background:"#fdf8f0",border:`1px solid ${GOLD}`,borderRadius:6,padding:"12px 16px",marginBottom:22,borderLeft:`3px solid ${GOLD}`}}>
                    <div style={{fontSize:9,fontWeight:700,color:NAVY,marginBottom:5,fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1}}>⚠ Alertes automatiques</div>
                    {opSelected.alerts.map((a,i)=><div key={i} style={{fontSize:13,color:"#7a5000",fontFamily:"sans-serif"}}>· {a}</div>)}
                  </div>
                )}
                <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`2px solid ${CREAM}`}}>
                  {["exploitation","notes","tasks"].map(tab=>(
                    <button key={tab} onClick={()=>setOpTab(tab)} style={{padding:"11px 22px",border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"sans-serif",letterSpacing:1,textTransform:"uppercase",color:opTab===tab?NAVY:"#bbb",borderBottom:opTab===tab?`2px solid ${GOLD}`:"2px solid transparent",marginBottom:-2}}>
                      {tab==="exploitation"?"Compte d'exploitation":tab==="notes"?"Notes":"Tâches"}
                    </button>
                  ))}
                </div>
                {opTab==="exploitation"&&<CompteExploitation restaurant={opSelected}/>}
                {opTab==="notes"&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
                      <button onClick={()=>setShowOpNote(!showOpNote)} style={bP}>+ Note</button>
                    </div>
                    {showOpNote&&(
                      <div style={{background:WHITE,borderRadius:8,padding:18,marginBottom:14,boxShadow:"0 2px 12px rgba(27,42,74,0.08)",borderLeft:`3px solid ${GOLD}`}}>
                        <textarea value={opNote} onChange={e=>setOpNote(e.target.value)} placeholder="Saisir une note..." style={{...iS2,resize:"vertical",minHeight:80,lineHeight:1.7}}/>
                        <div style={{display:"flex",gap:8,marginTop:10}}>
                          <button onClick={addNote} style={bP}>Enregistrer</button>
                          <button onClick={()=>setShowOpNote(false)} style={bS}>Annuler</button>
                        </div>
                      </div>
                    )}
                    {opSelected.notes.map((n,i)=>(
                      <div key={i} style={{background:WHITE,borderRadius:7,padding:"16px 20px",marginBottom:9,boxShadow:"0 1px 8px rgba(27,42,74,0.07)"}}>
                        <div style={{fontSize:9,color:GOLD,marginBottom:7,fontFamily:"sans-serif",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>{n.date}</div>
                        <div style={{fontSize:14,lineHeight:1.6}}>{n.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                {opTab==="tasks"&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
                      <button onClick={()=>setShowOpTask(!showOpTask)} style={bP}>+ Tâche</button>
                    </div>
                    {showOpTask&&(
                      <div style={{background:WHITE,borderRadius:8,padding:18,marginBottom:14,boxShadow:"0 2px 12px rgba(27,42,74,0.08)",borderLeft:`3px solid ${GOLD}`}}>
                        <input value={opTask} onChange={e=>setOpTask(e.target.value)} placeholder="Nouvelle tâche..." style={iS2}/>
                        <div style={{display:"flex",gap:8,marginTop:10}}>
                          <button onClick={addTask} style={bP}>Ajouter</button>
                          <button onClick={()=>setShowOpTask(false)} style={bS}>Annuler</button>
                        </div>
                      </div>
                    )}
                    {opSelected.tasks.map(t=>(
                      <div key={t.id} onClick={()=>toggleTask(t.id)} style={{display:"flex",alignItems:"center",gap:12,background:WHITE,borderRadius:7,padding:"14px 18px",marginBottom:7,boxShadow:"0 1px 8px rgba(27,42,74,0.07)",cursor:"pointer",opacity:t.done?0.5:1,borderLeft:`3px solid ${t.done?GREEN:GOLD}`}}>
                        <div style={{width:17,height:17,borderRadius:3,border:`2px solid ${t.done?GREEN:GOLD}`,background:t.done?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {t.done&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                        </div>
                        <div style={{flex:1,fontSize:14,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODALS OP */}
            {showSaisie&&opSelected&&(
              <SaisieModal restaurant={opSelected} onSave={saveMonthData} onClose={()=>setShowSaisie(false)}/>
            )}
            {showAddDir&&(
              <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{background:WHITE,borderRadius:10,padding:34,width:420,boxShadow:"0 30px 80px rgba(0,0,0,0.3)",borderTop:`4px solid ${GOLD}`}}>
                  <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 22px",color:NAVY}}>Nouveau directeur</h2>
                  {[{k:"name",l:"Nom",p:"Jean Dupont"},{k:"email",l:"Email",p:"jean@lnd.fr"},{k:"password",l:"Mot de passe",p:"••••••••"}].map(f=>(
                    <div key={f.k} style={{marginBottom:13}}><label style={lS2}>{f.l}</label><input value={newDir[f.k]} onChange={e=>setNewDir({...newDir,[f.k]:e.target.value})} placeholder={f.p} type={f.k==="password"?"password":"text"} style={iS2}/></div>
                  ))}
                  <div style={{display:"flex",gap:8,marginTop:22}}>
                    <button onClick={()=>{if(!newDir.name||!newDir.email)return;const id="dir_"+Date.now();setUsers([...users,{id,email:newDir.email,password:newDir.password,role:"directeur",name:newDir.name,avatar:newDir.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}]);setShowAddDir(false);setNewDir({name:"",email:"",password:""}); }} style={{...bP,flex:1,padding:13,fontSize:12}}>Créer</button>
                    <button onClick={()=>setShowAddDir(false)} style={{...bS,flex:1,padding:13}}>Annuler</button>
                  </div>
                </div>
              </div>
            )}
            {showAddResto&&(
              <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{background:WHITE,borderRadius:10,padding:34,width:480,boxShadow:"0 30px 80px rgba(0,0,0,0.3)",borderTop:`4px solid ${GOLD}`}}>
                  <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 22px",color:NAVY}}>Nouveau restaurant</h2>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[{k:"name",l:"Restaurant"},{k:"contact",l:"Contact"},{k:"email",l:"Email"},{k:"phone",l:"Téléphone"}].map(f=>(
                      <div key={f.k}><label style={lS2}>{f.l}</label><input value={newResto[f.k]||""} onChange={e=>setNewResto({...newResto,[f.k]:e.target.value})} style={iS2}/></div>
                    ))}
                    <div><label style={lS2}>Directeur</label>
                      <select value={newResto.directorId} onChange={e=>setNewResto({...newResto,directorId:e.target.value})} style={{...iS2,background:WHITE,cursor:"pointer"}}>
                        <option value="">— Choisir —</option>
                        {directors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div><label style={lS2}>Caisse</label>
                      <select value={newResto.caisse} onChange={e=>setNewResto({...newResto,caisse:e.target.value})} style={{...iS2,background:WHITE,cursor:"pointer"}}>
                        {["Lightspeed","Square","L'Addition","Zelty","Autre"].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:22}}>
                    <button onClick={()=>{setRestaurants([{...newResto,id:Date.now(),since:new Date().toISOString().slice(0,7),employees:0,months:emptyMonths(),notes:[],tasks:[],alerts:[]},...restaurants]);setShowAddResto(false);setNewResto({name:"",contact:"",email:"",phone:"",caisse:"Lightspeed",status:"actif",stage:"Onboarding",directorId:""});}} style={{...bP,flex:1,padding:13,fontSize:12}}>Créer</button>
                    <button onClick={()=>setShowAddResto(false)} style={{...bS,flex:1,padding:13}}>Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ MODULE COMMERCIAL ══════════════ */}
        {showCommercialModule&&!showRapportModule&&(
          <>
            {/* Top bar commercial */}
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:22,flexWrap:"wrap"}}>
              <input value={comSearch} onChange={e=>setComSearch(e.target.value)} placeholder="Rechercher restaurant, contact..." style={{flex:1,minWidth:200,padding:"10px 15px",borderRadius:6,border:"1px solid rgba(27,42,74,0.15)",fontSize:13,outline:"none",background:WHITE,fontFamily:"sans-serif"}}/>
              <select value={comFilterStage} onChange={e=>setComFilterStage(e.target.value)} style={{padding:"10px 13px",borderRadius:6,border:"1px solid rgba(27,42,74,0.15)",fontSize:12,outline:"none",background:WHITE,cursor:"pointer",fontFamily:"sans-serif",color:NAVY}}>
                <option value="Tous">Toutes les étapes</option>
                {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={()=>setShowNewProspect(true)} style={bP}>+ Nouveau</button>
            </div>

            {/* KPIs commercial */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
              {[
                {label:"Total contacts",val:comStats.total,accent:NAVY},
                {label:"CA portefeuille",val:fmtEur(prospects.reduce((s,r)=>s+(r.ca||0),0)),accent:GOLD},
                {label:"Validés",val:comStats.valides,accent:GREEN},
                {label:"Rev. forfaits/mois",val:comStats.revForfaits>0?`${comStats.revForfaits.toLocaleString("fr-FR")} €`:"—",accent:GOLD},
              ].map((k,i)=>(
                <div key={i} style={{background:WHITE,borderRadius:8,padding:"16px 18px",boxShadow:"0 2px 12px rgba(27,42,74,0.07)",borderLeft:`4px solid ${k.accent}`}}>
                  <div style={{fontSize:9,color:"#aaa",letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:5,fontFamily:"sans-serif"}}>{k.label}</div>
                  <div style={{fontSize:22,fontWeight:700,color:k.accent,letterSpacing:-0.5,fontFamily:"'Cormorant Garamond',serif"}}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* PIPELINE COM */}
            {comView==="pipeline"&&(
              <div>
                <div style={{fontSize:10,letterSpacing:3,color:GOLD,textTransform:"uppercase",marginBottom:14,fontWeight:600,fontFamily:"sans-serif"}}>Pipeline — {filteredProspects.length} contact{filteredProspects.length>1?"s":""}</div>
                <div style={{display:"flex",gap:11,overflowX:"auto",paddingBottom:8}}>
                  {STAGES.map(stage=>{
                    const items=byStage[stage]||[];
                    const sc=STAGE_STYLE[stage];
                    return (
                      <div key={stage} style={{flexShrink:0,width:220,background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(27,42,74,0.06)"}}>
                        <div style={{padding:"11px 13px",background:sc.bg,borderBottom:`2px solid ${sc.dot}22`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:sc.dot,display:"inline-block"}}/><span style={{fontSize:11,fontWeight:700,color:sc.color}}>{stage}</span></div>
                            <span style={{fontSize:11,fontWeight:700,color:sc.color,background:"rgba(255,255,255,0.6)",width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{items.length}</span>
                          </div>
                          {items.some(r=>r.ca>0)&&<div style={{fontSize:10,color:sc.color,marginTop:3,opacity:0.7,fontFamily:"sans-serif"}}>CA : {fmtEur(items.reduce((s,r)=>s+(r.ca||0),0))}</div>}
                        </div>
                        <div style={{padding:"7px",maxHeight:480,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                          {items.length===0&&<div style={{fontSize:11,color:"#ddd",textAlign:"center",padding:"14px 0"}}>—</div>}
                          {items.map(r=>{
                            const nr=(r.rappels||[]).filter(rap=>new Date(rap.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
                            return (
                              <div key={r.id} onClick={()=>setComSelected(r)} style={{background:CREAM,borderRadius:5,padding:"11px",cursor:"pointer",border:"1px solid transparent",transition:"all 0.15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${GOLD}40`;e.currentTarget.style.transform="translateY(-1px)"}}
                                onMouseLeave={e=>{e.currentTarget.style.border="1px solid transparent";e.currentTarget.style.transform="none"}}>
                                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:2,lineHeight:1.3}}>{r.nom}</div>
                                {r.contact&&<div style={{fontSize:11,color:"#888",marginBottom:3,fontFamily:"sans-serif"}}>{r.contact}</div>}
                                {r.ca>0&&<div style={{fontSize:12,fontWeight:700,color:GOLD,marginBottom:3,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(r.ca)}</div>}
                                {(r.forfaits||[]).length>0&&(
                                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:3}}>
                                    {(r.forfaits||[]).map(f=>{
                                      const forf=FORFAITS.find(ff=>ff.options.find(o=>o.id===f.optionId));
                                      if(!forf) return null;
                                      return <span key={f.optionId} style={{fontSize:9,background:forf.bg,color:forf.color,padding:"2px 5px",borderRadius:2,fontWeight:700,fontFamily:"sans-serif"}}>{forf.icon} {forf.nom.split(" ")[0]}</span>;
                                    })}
                                  </div>
                                )}
                                {r.ville&&<div style={{fontSize:10,color:"#aaa",fontFamily:"sans-serif"}}>📍 {r.ville}</div>}
                                {nr&&(
                                  <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid rgba(27,42,74,0.08)"}}>
                                    <div style={{fontSize:10,color:isOverdue(nr.date)?RED:isSoon(nr.date)?ORANGE:GOLD,fontWeight:600,fontFamily:"sans-serif"}}>
                                      {isOverdue(nr.date)?"⚠ ":isSoon(nr.date)?"⏰ ":"📅 "}{fmtDate(nr.date)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORFAITS VIEW COM */}
            {comView==="forfaits"&&(
              <div>
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:10,letterSpacing:4,color:GOLD,textTransform:"uppercase",marginBottom:8,fontWeight:600,fontFamily:"sans-serif"}}>Offre LND</div>
                  <h1 style={{fontSize:26,fontWeight:700,margin:0,fontFamily:"'Cormorant Garamond',serif"}}>Forfaits & Accompagnements</h1>
                  <div style={{width:36,height:2,background:GOLD,marginTop:9}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:28}}>
                  {FORFAITS.map(forf=>{
                    const revM=prospects.reduce((s,r)=>s+(r.forfaits||[]).reduce((ss,f)=>{const o=forf.options.find(o=>o.id===f.optionId);return ss+(o&&o.periode==="mois"?o.prix:0);},0),0);
                    return (
                      <div key={forf.id} style={{background:WHITE,borderRadius:10,overflow:"hidden",boxShadow:"0 3px 16px rgba(27,42,74,0.08)",border:"1px solid rgba(27,42,74,0.06)"}}>
                        <div style={{background:forf.bg,padding:"18px 22px",borderBottom:`2px solid ${forf.color}20`}}>
                          <div style={{fontSize:26,marginBottom:7}}>{forf.icon}</div>
                          <div style={{fontSize:15,fontWeight:700,color:forf.color,fontFamily:"'Cormorant Garamond',serif",marginBottom:3}}>{forf.nom}</div>
                          <div style={{fontSize:11,color:forf.color,opacity:0.7,fontFamily:"sans-serif"}}>{forf.description}</div>
                        </div>
                        <div style={{padding:"14px 18px"}}>
                          {forf.options.map(opt=>{
                            const nb=prospects.filter(r=>(r.forfaits||[]).find(f=>f.optionId===opt.id)).length;
                            return (
                              <div key={opt.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #f5f3f0"}}>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:12,fontWeight:600,color:NAVY,fontFamily:"sans-serif"}}>{opt.label}</div>
                                  <div style={{fontSize:10,color:"#aaa",fontFamily:"sans-serif"}}>{opt.detail}</div>
                                  {nb>0&&<div style={{fontSize:10,color:GREEN,fontWeight:700,marginTop:3,fontFamily:"sans-serif"}}>✓ {nb} client{nb>1?"s":""}</div>}
                                </div>
                                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                                  <div style={{fontSize:14,fontWeight:700,color:NAVY,fontFamily:"'Cormorant Garamond',serif"}}>{opt.prix>0?`${opt.prix.toLocaleString("fr-FR")} €`:"Devis"}</div>
                                  {opt.prix>0&&<div style={{fontSize:10,color:"#aaa",fontFamily:"sans-serif"}}>/{opt.periode}</div>}
                                </div>
                              </div>
                            );
                          })}
                          {revM>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`2px solid ${forf.bg}`,display:"flex",justifyContent:"space-between"}}>
                            <span style={{fontSize:11,color:forf.color,fontWeight:600,fontFamily:"sans-serif"}}>Revenus/mois</span>
                            <span style={{fontSize:14,fontWeight:700,color:forf.color,fontFamily:"'Cormorant Garamond',serif"}}>{revM.toLocaleString("fr-FR")} €</span>
                          </div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(27,42,74,0.07)"}}>
                  <div style={{padding:"16px 22px",borderBottom:`1px solid ${CREAM}`}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:NAVY,fontFamily:"sans-serif"}}>Clients avec forfait actif</div>
                  </div>
                  {prospects.filter(r=>(r.forfaits||[]).length>0).map(r=>{
                    const mensuel=(r.forfaits||[]).reduce((s,f)=>{const o=FORFAITS.flatMap(ff=>ff.options).find(o=>o.id===f.optionId);return s+(o&&o.periode==="mois"?o.prix:0);},0);
                    return (
                      <div key={r.id} onClick={()=>setComSelected(r)} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 22px",borderBottom:`1px solid ${CREAM}`,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background=CREAM}
                        onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:4}}>{r.nom}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {(r.forfaits||[]).map(f=>{
                              const forf=FORFAITS.find(ff=>ff.options.find(o=>o.id===f.optionId));
                              const opt=FORFAITS.flatMap(ff=>ff.options).find(o=>o.id===f.optionId);
                              if(!forf||!opt) return null;
                              return <span key={f.optionId} style={{fontSize:10,background:forf.bg,color:forf.color,padding:"2px 7px",borderRadius:3,fontWeight:600,fontFamily:"sans-serif"}}>{forf.icon} {opt.label}</span>;
                            })}
                          </div>
                        </div>
                        <StageBadge stage={r.stage}/>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:700,color:NAVY,fontFamily:"'Cormorant Garamond',serif"}}>{mensuel>0?`${mensuel.toLocaleString("fr-FR")} €/mois`:"Intervention"}</div>
                          <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{r.ville||""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CA VIEW COM */}
            {comView==="ca"&&(
              <div>
                <div style={{fontSize:10,letterSpacing:4,color:GOLD,textTransform:"uppercase",marginBottom:18,fontWeight:600,fontFamily:"sans-serif"}}>Classement par CA</div>
                <div style={{background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(27,42,74,0.07)"}}>
                  {[...filteredProspects].sort((a,b)=>(b.ca||0)-(a.ca||0)).map((r,i)=>(
                    <div key={r.id} onClick={()=>setComSelected(r)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 22px",borderBottom:`1px solid ${CREAM}`,cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background=CREAM}
                      onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:i<3?NAVY:CREAM,border:`1px solid ${i<3?GOLD:"rgba(27,42,74,0.12)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<3?GOLD:NAVY,flexShrink:0,fontFamily:"sans-serif"}}>{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                          <span style={{fontWeight:700,fontSize:14}}>{r.nom}</span>
                          <StageBadge stage={r.stage}/>
                          {r.ville&&<span style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>📍 {r.ville}</span>}
                        </div>
                        <div style={{height:5,background:"rgba(27,42,74,0.07)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.min((r.ca||0)/Math.max(...filteredProspects.map(x=>x.ca||0),1)*100,100)}%`,background:`linear-gradient(90deg,${GOLD},${GOLD_L})`,borderRadius:3}}/>
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,minWidth:100}}>
                        <div style={{fontSize:17,fontWeight:700,color:NAVY,fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(r.ca)}</div>
                        <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{r.salaries||0} salarié{(r.salaries||0)>1?"s":""}</div>
                      </div>
                      <div style={{width:80,flexShrink:0}}><Sparkline data={r.caHistory||[]} width={80} height={26}/></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLEAU COM */}
            {comView==="table"&&(
              <div style={{background:WHITE,borderRadius:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(27,42,74,0.07)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:NAVY}}>
                      {["Restaurant","Contact","Ville","CA","Salariés","Étape","Forfaits","Rappel"].map(h=>(
                        <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"sans-serif"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProspects.map(r=>{
                      const nr=(r.rappels||[]).filter(rap=>new Date(rap.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
                      return (
                        <tr key={r.id} style={{borderBottom:`1px solid ${CREAM}`,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background=CREAM}
                          onMouseLeave={e=>e.currentTarget.style.background=WHITE}>
                          <td style={{padding:"12px 16px",fontWeight:700,fontSize:14}} onClick={()=>setComSelected(r)}>{r.nom}</td>
                          <td style={{padding:"12px 16px",fontSize:12,color:"#666",fontFamily:"sans-serif"}}>{r.contact||"—"}</td>
                          <td style={{padding:"12px 16px",fontSize:12,color:"#888",fontFamily:"sans-serif"}}>{r.ville||"—"}</td>
                          <td style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:r.ca>0?NAVY:"#ccc",fontFamily:"'Cormorant Garamond',serif"}}>{fmtEur(r.ca)}</td>
                          <td style={{padding:"12px 16px",fontSize:12,fontFamily:"sans-serif"}}>{r.salaries||"—"}</td>
                          <td style={{padding:"12px 16px"}}><StageBadge stage={r.stage}/></td>
                          <td style={{padding:"12px 16px"}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                              {(r.forfaits||[]).length===0&&<span style={{color:"#ddd",fontSize:11}}>—</span>}
                              {(r.forfaits||[]).map(f=>{const forf=FORFAITS.find(ff=>ff.options.find(o=>o.id===f.optionId));if(!forf)return null;return <span key={f.optionId} style={{fontSize:9,background:forf.bg,color:forf.color,padding:"2px 5px",borderRadius:2,fontWeight:700,fontFamily:"sans-serif"}}>{forf.icon}</span>;})}
                            </div>
                          </td>
                          <td style={{padding:"12px 16px"}}><RappelBadge date={nr?.date}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* RAPPELS COM */}
            {comView==="rappels"&&(
              <VueRappelsCom prospects={filteredProspects} onOpen={r=>setComSelected(r)}/>
            )}

            {/* FICHE COMMERCIALE */}
            {(comSelected||showNewProspect)&&(
              <FicheCommerciale
                resto={comSelected||{id:null,nom:"",contact:"",email:"",tel:"",adresse:"",ville:"",region:"",cp:"",ca:0,salaries:0,stage:"Prospect",notes:"",rappels:[],caHistory:Array(12).fill(0),forfaits:[]}}
                onClose={()=>{setComSelected(null);setShowNewProspect(false);}}
                onSave={saveProspect}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
