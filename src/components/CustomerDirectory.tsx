import {useEffect,useMemo,useState,type FormEvent} from "react";
import {Mail,Phone,Plus,Search,Users,X} from "lucide-react";
import {createContact,getContacts,updateContact,type Contact,type ContactStatus} from "../api";
import {useWorkspace} from "../auth/AuthGate";

const labels={
 en:{title:"Customers",subtitle:"Your contacts, leads and customers in one place.",search:"Search by name, email, company or phone",add:"Add contact",cancel:"Cancel",name:"Full name",email:"Email address",phone:"Phone",company:"Company",status:"Relationship",lead:"Lead",customer:"Customer",inactive:"Inactive",save:"Save contact",saving:"Saving…",all:"All contacts",empty:"No contacts yet",emptyHelp:"Add your first lead or customer to start building your relationships.",noMatches:"No contacts match this search.",loading:"Loading contacts…",loadError:"Could not load contacts.",saveError:"Could not save this contact.",updateError:"Could not update contact status.",count:"contacts",permission:"You have read-only access to this workspace."},
 he:{title:"לקוחות ואנשי קשר",subtitle:"כל אנשי הקשר, הלידים והלקוחות במקום אחד.",search:"חיפוש לפי שם, אימייל, חברה או טלפון",add:"הוספת איש קשר",cancel:"ביטול",name:"שם מלא",email:"כתובת אימייל",phone:"טלפון",company:"חברה",status:"סוג קשר",lead:"ליד",customer:"לקוח",inactive:"לא פעיל",save:"שמירת איש קשר",saving:"שומר…",all:"כל אנשי הקשר",empty:"עדיין אין אנשי קשר",emptyHelp:"אפשר להוסיף ליד או לקוח ראשון ולהתחיל לנהל את הקשרים העסקיים.",noMatches:"לא נמצאו אנשי קשר התואמים לחיפוש.",loading:"טוען אנשי קשר…",loadError:"לא ניתן לטעון את אנשי הקשר.",saveError:"לא ניתן לשמור את איש הקשר.",updateError:"לא ניתן לעדכן את סטטוס איש הקשר.",count:"אנשי קשר",permission:"יש לך הרשאת צפייה בלבד בסביבת העבודה."}
};
const statusClass:Record<ContactStatus,string>={lead:"lead",customer:"customer",inactive:"inactive"};

export function CustomerDirectory(){
 const {workspace,accessToken}=useWorkspace();
 const [lang,setLang]=useState<"en"|"he">(()=>typeof navigator!=="undefined"&&navigator.language.toLowerCase().startsWith("he")?"he":"en");
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState<string|null>(null);
 const [mutationError,setMutationError]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [statusFilter,setStatusFilter]=useState<"all"|ContactStatus>("all");
 const [showForm,setShowForm]=useState(false);
 const [saving,setSaving]=useState(false);
 const [updatingId,setUpdatingId]=useState<string|null>(null);
 const [form,setForm]=useState({fullName:"",email:"",phone:"",company:"",status:"lead" as ContactStatus});
 const rtl=lang==="he";
 const t=(key:keyof typeof labels.en)=>labels[lang][key];
 const canWrite=["owner","admin","manager","member"].includes(workspace?.role??"");
 async function reload(){
  if(!workspace?.workspaceId){setContacts([]);setLoading(false);return;}
  setLoading(true);setLoadError(null);
  try{const result=await getContacts(workspace.workspaceId,accessToken);setContacts(result.items);}
  catch(error){setLoadError(error instanceof Error?error.message:t("loadError"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void reload();},[workspace?.workspaceId,accessToken]);
 const filtered=useMemo(()=>{
  const normalized=query.trim().toLocaleLowerCase();
  return contacts.filter(contact=>{
   const matchesStatus=statusFilter==="all"||contact.status===statusFilter;
   const searchable=[contact.fullName,contact.email,contact.company,contact.phone].filter(Boolean).join(" ").toLocaleLowerCase();
   return matchesStatus&&(!normalized||searchable.includes(normalized));
  });
 },[contacts,query,statusFilter]);
 const counts=useMemo(()=>({
  all:contacts.length,
  lead:contacts.filter(item=>item.status==="lead").length,
  customer:contacts.filter(item=>item.status==="customer").length,
  inactive:contacts.filter(item=>item.status==="inactive").length
 }),[contacts]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!workspace?.workspaceId||!canWrite)return;
  setSaving(true);setMutationError(null);
  try{
   await createContact(workspace.workspaceId,accessToken,{
    fullName:form.fullName.trim(),email:form.email.trim()||null,phone:form.phone.trim()||null,
    company:form.company.trim()||null,status:form.status
   });
   setForm({fullName:"",email:"",phone:"",company:"",status:"lead"});
   setShowForm(false);await reload();
  }catch(error){setMutationError(error instanceof Error?error.message:t("saveError"));}
  finally{setSaving(false);}
 }
 async function changeStatus(contact:Contact,status:ContactStatus){
  if(!workspace?.workspaceId||!canWrite||status===contact.status)return;
  setUpdatingId(contact.id);setMutationError(null);
  try{
   const updated=await updateContact(workspace.workspaceId,contact.id,accessToken,{status});
   setContacts(current=>current.map(item=>item.id===contact.id?updated.contact:item));
  }catch(error){setMutationError(error instanceof Error?error.message:t("updateError"));}
  finally{setUpdatingId(null);}
 }
 return <section className="customers-page" dir={rtl?"rtl":"ltr"}>
  <div className="customers-heading">
   <div><div className="customers-eyebrow"><Users size={15}/>{t("all")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div>
   <div className="customers-heading-actions">
    <button className="customers-lang" onClick={()=>setLang(rtl?"en":"he")} aria-label="Change language">{rtl?"EN":"עב"}</button>
    {canWrite&&<button className="customers-add" onClick={()=>setShowForm(value=>!value)}>{showForm?<X size={17}/>:<Plus size={17}/>}{showForm?t("cancel"):t("add")}</button>}
   </div>
  </div>
  <div className="customers-stats">
   <div><strong>{counts.all}</strong><span>{t("all")}</span></div>
   <div><strong>{counts.lead}</strong><span>{t("lead")}</span></div>
   <div><strong>{counts.customer}</strong><span>{t("customer")}</span></div>
   <div><strong>{counts.inactive}</strong><span>{t("inactive")}</span></div>
  </div>
  {showForm&&canWrite&&<form className="customers-form" onSubmit={submit}>
   <div className="customers-form-title"><h2>{t("add")}</h2><span>{t("name")} *</span></div>
   <div className="customers-form-grid">
    <label>{t("name")} *<input required maxLength={160} value={form.fullName} onChange={event=>setForm(value=>({...value,fullName:event.target.value}))}/></label>
    <label>{t("email")}<input type="email" maxLength={254} value={form.email} onChange={event=>setForm(value=>({...value,email:event.target.value}))}/></label>
    <label>{t("phone")}<input type="tel" maxLength={40} value={form.phone} onChange={event=>setForm(value=>({...value,phone:event.target.value}))}/></label>
    <label>{t("company")}<input maxLength={160} value={form.company} onChange={event=>setForm(value=>({...value,company:event.target.value}))}/></label>
    <label>{t("status")}<select value={form.status} onChange={event=>setForm(value=>({...value,status:event.target.value as ContactStatus}))}><option value="lead">{t("lead")}</option><option value="customer">{t("customer")}</option><option value="inactive">{t("inactive")}</option></select></label>
   </div>
   {mutationError&&<p className="customers-error" role="alert">{mutationError}</p>}
   <div className="customers-form-actions"><button type="button" className="customers-cancel" onClick={()=>setShowForm(false)}>{t("cancel")}</button><button type="submit" className="customers-save" disabled={saving||!form.fullName.trim()}>{saving?t("saving"):t("save")}</button></div>
  </form>}
  <div className="customers-toolbar">
   <div className="customers-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("search")} aria-label={t("search")}/></div>
   <div className="customers-filters" role="group" aria-label={t("status")}>
    {(["all","lead","customer","inactive"] as const).map(status=><button key={status} className={statusFilter===status?"selected":""} onClick={()=>setStatusFilter(status)}>{status==="all"?t("all"):t(status)}<span>{counts[status]}</span></button>)}
   </div>
  </div>
  {mutationError&&!showForm&&<p className="customers-error" role="alert">{mutationError}</p>}
  {loadError&&<div className="customers-state customers-error" role="alert">{loadError}<button onClick={()=>void reload()}>Retry</button></div>}
  {loading?<div className="customers-state">{t("loading")}</div>:!loadError&&filtered.length===0?
   <div className="customers-empty"><div className="customers-empty-icon"><Users size={25}/></div><h2>{contacts.length===0?t("empty"):t("noMatches")}</h2><p>{contacts.length===0?t("emptyHelp"):""}</p>{contacts.length===0&&canWrite&&<button onClick={()=>setShowForm(true)}><Plus size={16}/>{t("add")}</button>}</div>
   :!loadError&&<div className="customers-table-wrap"><table className="customers-table"><thead><tr><th>{t("name")}</th><th>{t("company")}</th><th>{t("email")}</th><th>{t("phone")}</th><th>{t("status")}</th></tr></thead><tbody>
    {filtered.map(contact=><tr key={contact.id}>
     <td><div className="customers-person"><span className="customers-avatar">{contact.fullName.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase()}</span><span><b>{contact.fullName}</b><small>{new Date(contact.createdAt).toLocaleDateString(lang==="he"?"he-IL":"en-US")}</small></span></div></td>
     <td>{contact.company||"—"}</td><td>{contact.email?<a href={"mailto:"+contact.email}><Mail size={13}/>{contact.email}</a>:"—"}</td>
     <td>{contact.phone?<a href={"tel:"+contact.phone}><Phone size={13}/>{contact.phone}</a>:"—"}</td>
     <td>{canWrite?<select aria-label={t("status")+" "+contact.fullName} className={"customers-status "+statusClass[contact.status]} value={contact.status} disabled={updatingId===contact.id} onChange={event=>void changeStatus(contact,event.target.value as ContactStatus)}><option value="lead">{t("lead")}</option><option value="customer">{t("customer")}</option><option value="inactive">{t("inactive")}</option></select>:<span className={"customers-status "+statusClass[contact.status]}>{t(contact.status)}</span>}</td>
    </tr>)}
   </tbody></table></div>}
  {!canWrite&&<p className="customers-readonly">{t("permission")}</p>}
 </section>;
}
