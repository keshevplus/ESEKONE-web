import {useEffect,useMemo,useState,type FormEvent} from "react";
import {CalendarClock,FolderKanban,Plus,Search,X} from "lucide-react";
import {createProject,getProjects,updateProject,type Project,type ProjectStatus} from "../api";
import {useWorkspace} from "../auth/AuthGate";

const labels={
 en:{title:"Projects",subtitle:"Plan, track and move your business work forward.",add:"New project",cancel:"Cancel",name:"Project name",description:"Description",status:"Status",planned:"Planned",active:"Active",on_hold:"On hold",completed:"Completed",archived:"Archived",save:"Create project",saving:"Creating…",search:"Search projects",all:"All projects",empty:"No projects yet",emptyHelp:"Create your first project to organize work and track progress.",none:"No projects match this search.",loading:"Loading projects…",loadError:"Could not load projects.",saveError:"Could not create project.",updateError:"Could not update project.",due:"Due",created:"Created",readOnly:"You have read-only access to this workspace."},
 he:{title:"פרויקטים",subtitle:"תכנון, מעקב וקידום העבודה העסקית במקום אחד.",add:"פרויקט חדש",cancel:"ביטול",name:"שם הפרויקט",description:"תיאור",status:"סטטוס",planned:"בתכנון",active:"פעיל",on_hold:"בהמתנה",completed:"הושלם",archived:"בארכיון",save:"יצירת פרויקט",saving:"יוצר…",search:"חיפוש פרויקטים",all:"כל הפרויקטים",empty:"עדיין אין פרויקטים",emptyHelp:"אפשר ליצור פרויקט ראשון כדי לארגן את העבודה ולעקוב אחר ההתקדמות.",none:"לא נמצאו פרויקטים התואמים לחיפוש.",loading:"טוען פרויקטים…",loadError:"לא ניתן לטעון את הפרויקטים.",saveError:"לא ניתן ליצור את הפרויקט.",updateError:"לא ניתן לעדכן את הפרויקט.",due:"יעד",created:"נוצר",readOnly:"יש לך הרשאת צפייה בלבד בסביבת העבודה."}
};
const allStatuses:ProjectStatus[]=["planned","active","on_hold","completed","archived"];

export function ProjectsDirectory(){
 const {workspace,accessToken}=useWorkspace();
 const [lang,setLang]=useState<"en"|"he">(()=>typeof navigator!=="undefined"&&navigator.language.toLowerCase().startsWith("he")?"he":"en");
 const [projects,setProjects]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState<string|null>(null);
 const [mutationError,setMutationError]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|ProjectStatus>("all");
 const [showForm,setShowForm]=useState(false);
 const [saving,setSaving]=useState(false);
 const [updatingId,setUpdatingId]=useState<string|null>(null);
 const [form,setForm]=useState({name:"",description:"",status:"planned" as "planned"|"active"});
 const rtl=lang==="he";
 const t=(key:keyof typeof labels.en)=>labels[lang][key];
 const canWrite=["owner","admin","manager","member"].includes(workspace?.role??"");
 async function reload(){
  if(!workspace?.workspaceId){setProjects([]);setLoading(false);return;}
  setLoading(true);setLoadError(null);
  try{const result=await getProjects(workspace.workspaceId,accessToken);setProjects(result.items);}
  catch(error){setLoadError(error instanceof Error?error.message:t("loadError"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void reload();},[workspace?.workspaceId,accessToken]);
 const filtered=useMemo(()=>{
  const normalized=query.trim().toLocaleLowerCase();
  return projects.filter(project=>(filter==="all"||project.status===filter)&&(!normalized||[project.name,project.description].filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized)));
 },[projects,filter,query]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!workspace?.workspaceId||!canWrite)return;
  setSaving(true);setMutationError(null);
  try{
   await createProject(workspace.workspaceId,accessToken,{name:form.name.trim(),description:form.description.trim()||null,status:form.status});
   setForm({name:"",description:"",status:"planned"});setShowForm(false);await reload();
  }catch(error){setMutationError(error instanceof Error?error.message:t("saveError"));}
  finally{setSaving(false);}
 }
 async function changeStatus(project:Project,status:ProjectStatus){
  if(!workspace?.workspaceId||!canWrite||status===project.status)return;
  setUpdatingId(project.id);setMutationError(null);
  try{
   const updated=await updateProject(workspace.workspaceId,project.id,accessToken,{status});
   setProjects(current=>current.map(item=>item.id===project.id?updated.project:item));
  }catch(error){setMutationError(error instanceof Error?error.message:t("updateError"));}
  finally{setUpdatingId(null);}
 }
 return <section className="projects-page" dir={rtl?"rtl":"ltr"}>
  <div className="projects-heading">
   <div><div className="projects-eyebrow"><FolderKanban size={15}/>{t("all")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div>
   <div className="projects-actions"><button className="projects-lang" onClick={()=>setLang(rtl?"en":"he")} aria-label="Change language">{rtl?"EN":"עב"}</button>{canWrite&&<button className="projects-add" onClick={()=>setShowForm(value=>!value)}>{showForm?<X size={17}/>:<Plus size={17}/>}{showForm?t("cancel"):t("add")}</button>}</div>
  </div>
  <div className="projects-summary">{allStatuses.map(status=><div key={status}><strong>{projects.filter(project=>project.status===status).length}</strong><span>{t(status)}</span></div>)}</div>
  {showForm&&canWrite&&<form className="projects-form" onSubmit={submit}>
   <div className="projects-form-grid">
    <label>{t("name")} *<input required minLength={2} maxLength={160} value={form.name} onChange={event=>setForm(value=>({...value,name:event.target.value}))}/></label>
    <label>{t("status")}<select value={form.status} onChange={event=>setForm(value=>({...value,status:event.target.value as "planned"|"active"}))}><option value="planned">{t("planned")}</option><option value="active">{t("active")}</option></select></label>
    <label className="projects-description">{t("description")}<textarea maxLength={10000} rows={3} value={form.description} onChange={event=>setForm(value=>({...value,description:event.target.value}))}/></label>
   </div>
   {mutationError&&<p className="projects-error" role="alert">{mutationError}</p>}
   <div className="projects-form-actions"><button type="button" className="projects-cancel" onClick={()=>setShowForm(false)}>{t("cancel")}</button><button type="submit" className="projects-save" disabled={saving||form.name.trim().length<2}>{saving?t("saving"):t("save")}</button></div>
  </form>}
  <div className="projects-toolbar"><div className="projects-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("search")}/></div><div className="projects-filters"><button className={filter==="all"?"selected":""} onClick={()=>setFilter("all")}>{t("all")}</button>{allStatuses.map(status=><button key={status} className={filter===status?"selected":""} onClick={()=>setFilter(status)}>{t(status)}</button>)}</div></div>
  {mutationError&&!showForm&&<p className="projects-error" role="alert">{mutationError}</p>}
  {loadError&&<div className="projects-state projects-error" role="alert">{loadError}<button onClick={()=>void reload()}>Retry</button></div>}
  {loading?<div className="projects-state">{t("loading")}</div>:!loadError&&filtered.length===0?<div className="projects-empty"><div className="projects-empty-icon"><FolderKanban size={24}/></div><h2>{projects.length===0?t("empty"):t("none")}</h2><p>{projects.length===0?t("emptyHelp"):""}</p>{projects.length===0&&canWrite&&<button onClick={()=>setShowForm(true)}><Plus size={16}/>{t("add")}</button>}</div>
   :!loadError&&<div className="projects-grid">{filtered.map(project=><article className="project-card" key={project.id}>
    <div className="project-card-top"><span className="project-icon"><FolderKanban size={17}/></span>{canWrite?<select aria-label={t("status")+" "+project.name} className={"project-status "+project.status} value={project.status} disabled={updatingId===project.id} onChange={event=>void changeStatus(project,event.target.value as ProjectStatus)}>{allStatuses.map(status=><option value={status} key={status}>{t(status)}</option>)}</select>:<span className={"project-status "+project.status}>{t(project.status)}</span>}</div>
    <h2>{project.name}</h2><p className="project-description">{project.description||"—"}</p>
    <div className="project-card-footer"><span><CalendarClock size={14}/>{project.dueAt?new Date(project.dueAt).toLocaleDateString(lang==="he"?"he-IL":"en-US"):t("created")+" "+new Date(project.createdAt).toLocaleDateString(lang==="he"?"he-IL":"en-US")}</span>{project.dueAt&&<small>{t("due")}</small>}</div>
   </article>)}</div>}
  {!canWrite&&<p className="projects-readonly">{t("readOnly")}</p>}
 </section>;
}
