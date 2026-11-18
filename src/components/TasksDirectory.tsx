import {useEffect,useMemo,useState,type FormEvent} from "react";
import {Bot,CalendarClock,Check,ChevronDown,ChevronUp,ClipboardList,Plus,Send,Workflow,X} from "lucide-react";
import {createAgentRequest,createTask,getAgentRequests,getProjects,getTaskEvents,getTasks,updateTask,type AgentRequest,type Project,type TaskEvent,type TaskPriority,type TaskStatus,type WorkItem} from "../api";
import {useWorkspace} from "../auth/AuthGate";

const statuses:TaskStatus[]=["backlog","ready","in_progress","blocked","review","testing","done"];
const priorities:TaskPriority[]=["low","normal","high","urgent"];
const transitions:Record<TaskStatus,TaskStatus[]>={backlog:["ready","in_progress","blocked"],ready:["in_progress","blocked"],in_progress:["blocked","review","testing"],blocked:["ready","in_progress"],review:["in_progress","testing"],testing:["in_progress","done"],done:["in_progress"]};
const agents=["admin","crm","projects","operations","growth","support"];
const copy={
 en:{title:"Tasks & workflows",subtitle:"A live view of work, ownership, progress and agent handoffs.",add:"New task",cancel:"Cancel",task:"Task title",description:"Description",priority:"Priority",status:"Status",project:"Project",due:"Due date",acceptance:"Acceptance criteria",save:"Create task",saving:"Creating…",all:"All tasks",search:"Search tasks, projects or agents",empty:"No tasks yet",emptyHelp:"Create the first task and give your team a clear next action.",noMatches:"No tasks match this filter.",loading:"Loading tasks…",loadError:"Could not load tasks.",createError:"Could not create the task.",updateError:"Could not update the task.",details:"Details & activity",hide:"Hide details",ask:"Ask an agent to work",agent:"Specialist agent",prompt:"Describe what needs to be done. Include the expected result and any relevant context.",send:"Queue agent request",sending:"Queuing…",queued:"Request queued. A worker must claim it before work begins.",queueError:"Could not queue the agent request.",history:"Agent requests",activity:"Task activity",evidence:"Latest evidence",next:"Next action",criteria:"Acceptance criteria",noDetails:"No agent requests or activity yet.",readonly:"You have read-only access to this workspace.",created:"Created",noDue:"No due date",normal:"Normal",low:"Low",high:"High",urgent:"Urgent",backlog:"Backlog",ready:"Ready",in_progress:"In progress",blocked:"Blocked",review:"Review",testing:"Testing",done:"Done",planned:"Planned",active:"Active",waiting:"Waiting for a worker",claimed:"Claimed by worker",waitingApproval:"Awaiting approval",attempt:"Attempt",completed:"Completed",failed:"Failed",cancelled:"Cancelled",started:"Started",noProject:"No project",selectProject:"Unassigned",statusChange:"Move task to",allStatuses:"All statuses",taskBy:"Assigned agent",detailsError:"Could not load task history."},
 he:{title:"משימות ותהליכי עבודה",subtitle:"תצוגה חיה של העבודה, האחריות, ההתקדמות והעברת משימות לסוכנים.",add:"משימה חדשה",cancel:"ביטול",task:"כותרת המשימה",description:"תיאור",priority:"עדיפות",status:"סטטוס",project:"פרויקט",due:"תאריך יעד",acceptance:"תנאי קבלה",save:"יצירת משימה",saving:"יוצר…",all:"כל המשימות",search:"חיפוש משימות, פרויקטים או סוכנים",empty:"עדיין אין משימות",emptyHelp:"אפשר ליצור משימה ראשונה ולהגדיר לצוות את הצעד הבא.",noMatches:"לא נמצאו משימות התואמות לסינון.",loading:"טוען משימות…",loadError:"לא ניתן לטעון את המשימות.",createError:"לא ניתן ליצור את המשימה.",updateError:"לא ניתן לעדכן את המשימה.",details:"פרטים ופעילות",hide:"הסתרת פרטים",ask:"בקשה מסוכן לטפל במשימה",agent:"סוכן מקצועי",prompt:"תאר מה צריך לבצע, מהי התוצאה המצופה ואיזה הקשר חשוב להכיר.",send:"העברת בקשה לסוכן",sending:"שולח…",queued:"הבקשה נכנסה לתור. סוכן צריך לתפוס אותה לפני תחילת העבודה.",queueError:"לא ניתן להעביר את הבקשה לסוכן.",history:"בקשות לסוכנים",activity:"פעילות המשימה",evidence:"הראיה האחרונה",next:"הצעד הבא",criteria:"תנאי קבלה",noDetails:"עדיין אין בקשות לסוכנים או פעילות.",readonly:"יש לך הרשאת צפייה בלבד בסביבת העבודה.",created:"נוצרה",noDue:"ללא תאריך יעד",normal:"רגילה",low:"נמוכה",high:"גבוהה",urgent:"דחופה",backlog:"בהמתנה",ready:"מוכנה",in_progress:"בתהליך",blocked:"חסומה",review:"לבדיקה",testing:"בבדיקות",done:"הושלמה",planned:"בתכנון",active:"פעילה",waiting:"ממתינה לסוכן",claimed:"הסוכן בטיפול",waitingApproval:"ממתינה לאישור",attempt:"ניסיון",completed:"הושלמה",failed:"נכשלה",cancelled:"בוטלה",started:"התחילה",noProject:"ללא פרויקט",selectProject:"ללא שיוך",statusChange:"העברת המשימה ל",allStatuses:"כל הסטטוסים",taskBy:"הסוכן המטפל",detailsError:"לא ניתן לטעון את היסטוריית המשימה."}
};
const agentLabels:Record<string,{en:string;he:string}>={admin:{en:"Admin coordinator",he:"מתאם ראשי"},crm:{en:"CRM agent",he:"סוכן CRM"},projects:{en:"Project agent",he:"סוכן פרויקטים"},operations:{en:"Operations agent",he:"סוכן תפעול"},growth:{en:"Growth agent",he:"סוכן צמיחה"},support:{en:"Support agent",he:"סוכן תמיכה"}};

export function TasksDirectory(){
 const {workspace,accessToken}=useWorkspace();
 const [lang,setLang]=useState<"en"|"he">(()=>typeof navigator!=="undefined"&&navigator.language.toLowerCase().startsWith("he")?"he":"en");
 const [tasks,setTasks]=useState<WorkItem[]>([]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState<string|null>(null);
 const [mutationError,setMutationError]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|TaskStatus>("all");
 const [showForm,setShowForm]=useState(false);
 const [saving,setSaving]=useState(false);
 const [updatingId,setUpdatingId]=useState<string|null>(null);
 const [expandedId,setExpandedId]=useState<string|null>(null);
 const [agentTaskId,setAgentTaskId]=useState<string|null>(null);
 const [agentKey,setAgentKey]=useState("admin");
 const [prompt,setPrompt]=useState("");
 const [sending,setSending]=useState(false);
 const [requests,setRequests]=useState<Record<string,AgentRequest[]>>({});
 const [events,setEvents]=useState<Record<string,TaskEvent[]>>({});
 const [detailError,setDetailError]=useState<string|null>(null);
 const [queueMessage,setQueueMessage]=useState<string|null>(null);
 const [form,setForm]=useState({title:"",description:"",priority:"normal" as TaskPriority,projectId:"",dueAt:"",acceptanceCriteria:""});
 const rtl=lang==="he";
 const t=(key:keyof typeof copy.en)=>copy[lang][key];
 const canWrite=["owner","admin","manager","member"].includes(workspace?.role??"");
 async function reload(){
  if(!workspace?.workspaceId){setTasks([]);setProjects([]);setLoading(false);return;}
  setLoading(true);setLoadError(null);
  try{
   const [taskResult,projectResult]=await Promise.all([getTasks(workspace.workspaceId,accessToken),getProjects(workspace.workspaceId,accessToken)]);
   setTasks(taskResult.items);setProjects(projectResult.items);
  }catch(error){setLoadError(error instanceof Error?error.message:t("loadError"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void reload();},[workspace?.workspaceId,accessToken]);
 useEffect(()=>{
  const refresh=()=>{
   if(document.visibilityState!=="visible"||!workspace?.workspaceId)return;
   void getTasks(workspace.workspaceId,accessToken).then(result=>setTasks(result.items)).catch(()=>undefined);
   if(expandedId)void loadDetails(expandedId);
  };
  const timer=window.setInterval(refresh,15000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
 },[workspace?.workspaceId,accessToken,expandedId]);
 const filtered=useMemo(()=>{
  const normalized=query.trim().toLocaleLowerCase();
  return tasks.filter(task=>{
   const project=projects.find(item=>item.id===task.projectId);
   return (filter==="all"||task.status===filter)&&(!normalized||[task.title,task.description,task.assignedAgent,project?.name].filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized));
  });
 },[tasks,projects,filter,query]);
 async function loadDetails(taskId:string){
  if(!workspace?.workspaceId)return;
  setDetailError(null);
  try{
   const [requestResult,eventResult]=await Promise.all([
    getAgentRequests(workspace.workspaceId,taskId,accessToken),
    getTaskEvents(workspace.workspaceId,taskId,accessToken)
   ]);
   setRequests(current=>({...current,[taskId]:requestResult.requests}));
   setEvents(current=>({...current,[taskId]:eventResult.events}));
  }catch(error){setDetailError(error instanceof Error?error.message:t("detailsError"));}
 }
 async function toggleDetails(taskId:string){
  if(expandedId===taskId){setExpandedId(null);setAgentTaskId(null);return;}
  setExpandedId(taskId);setAgentTaskId(null);setQueueMessage(null);await loadDetails(taskId);
 }
 async function submitTask(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!workspace?.workspaceId||!canWrite)return;
  setSaving(true);setMutationError(null);
  try{
   await createTask(workspace.workspaceId,accessToken,{
    title:form.title.trim(),description:form.description.trim()||null,priority:form.priority,
    projectId:form.projectId||null,dueAt:form.dueAt?new Date(form.dueAt+"T12:00:00").toISOString():null,
    assignedAgent:null,acceptanceCriteria:form.acceptanceCriteria.trim()||null
   });
   setForm({title:"",description:"",priority:"normal",projectId:"",dueAt:"",acceptanceCriteria:""});
   setShowForm(false);await reload();
  }catch(error){setMutationError(error instanceof Error?error.message:t("createError"));}
  finally{setSaving(false);}
 }
 async function changeStatus(task:WorkItem,status:TaskStatus){
  if(!workspace?.workspaceId||!canWrite||status===task.status)return;
  setUpdatingId(task.id);setMutationError(null);
  try{
   const updated=await updateTask(workspace.workspaceId,task.id,accessToken,{status});
   setTasks(current=>current.map(item=>item.id===task.id?updated.item:item));
  }catch(error){setMutationError(error instanceof Error?error.message:t("updateError"));}
  finally{setUpdatingId(null);}
 }
 async function askAgent(task:WorkItem){
  if(!workspace?.workspaceId||!canWrite||prompt.trim().length<8)return;
  setSending(true);setQueueMessage(null);setMutationError(null);
  try{
   const result=await createAgentRequest(workspace.workspaceId,task.id,accessToken,{prompt:prompt.trim(),agentKey});
   setQueueMessage(result.message||t("queued"));setPrompt("");setAgentTaskId(task.id);
   await reload();await loadDetails(task.id);
  }catch(error){setMutationError(error instanceof Error?error.message:t("queueError"));}
  finally{setSending(false);}
 }
 function agentRequestStatus(status:string){
  const translations:Record<string,string>={queued:t("waiting"),running:t("claimed"),waiting_approval:t("waitingApproval"),completed:t("completed"),failed:t("failed"),cancelled:t("cancelled")};
  return translations[status]??status;
 }
 const counts=useMemo(()=>Object.fromEntries(statuses.map(status=>[status,tasks.filter(task=>task.status===status).length])) as Record<TaskStatus,number>,[tasks]);
 return <section className="tasks-page" dir={rtl?"rtl":"ltr"}>
  <div className="tasks-heading"><div><div className="tasks-eyebrow"><Workflow size={15}/>{t("all")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div><div className="tasks-heading-actions"><button className="tasks-lang" onClick={()=>setLang(rtl?"en":"he")} aria-label="Change language">{rtl?"EN":"עב"}</button>{canWrite&&<button className="tasks-add" onClick={()=>setShowForm(value=>!value)}>{showForm?<X size={17}/>:<Plus size={17}/>}{showForm?t("cancel"):t("add")}</button>}</div></div>
  <div className="tasks-summary">{statuses.map(status=><button key={status} className={filter===status?"selected":""} onClick={()=>setFilter(filter===status?"all":status)}><strong>{counts[status]}</strong><span>{t(status)}</span></button>)}</div>
  {showForm&&canWrite&&<form className="tasks-form" onSubmit={submitTask}>
   <label>{t("task")} *<input required minLength={1} maxLength={200} value={form.title} onChange={event=>setForm(value=>({...value,title:event.target.value}))}/></label>
   <label>{t("description")}<textarea rows={2} maxLength={10000} value={form.description} onChange={event=>setForm(value=>({...value,description:event.target.value}))}/></label>
   <div className="tasks-form-grid">
    <label>{t("priority")}<select value={form.priority} onChange={event=>setForm(value=>({...value,priority:event.target.value as TaskPriority}))}>{priorities.map(priority=><option key={priority} value={priority}>{t(priority)}</option>)}</select></label>
    <label>{t("project")}<select value={form.projectId} onChange={event=>setForm(value=>({...value,projectId:event.target.value}))}><option value="">{t("selectProject")}</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <label>{t("due")}<input type="date" value={form.dueAt} onChange={event=>setForm(value=>({...value,dueAt:event.target.value}))}/></label>
   </div>
   <label>{t("acceptance")}<textarea rows={2} maxLength={10000} value={form.acceptanceCriteria} onChange={event=>setForm(value=>({...value,acceptanceCriteria:event.target.value}))}/></label>
   {mutationError&&<p className="tasks-error" role="alert">{mutationError}</p>}
   <div className="tasks-form-actions"><button type="button" className="tasks-cancel" onClick={()=>setShowForm(false)}>{t("cancel")}</button><button type="submit" className="tasks-save" disabled={saving||!form.title.trim()}>{saving?t("saving"):t("save")}</button></div>
  </form>}
  <div className="tasks-toolbar"><div className="tasks-search"><ClipboardList size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("search")}/></div><div className="tasks-filter-select"><label>{t("status")}<select value={filter} onChange={event=>setFilter(event.target.value as "all"|TaskStatus)}><option value="all">{t("allStatuses")}</option>{statuses.map(status=><option key={status} value={status}>{t(status)}</option>)}</select></label></div></div>
  {mutationError&&!showForm&&<p className="tasks-error" role="alert">{mutationError}</p>}
  {loadError&&<div className="tasks-state tasks-error" role="alert">{loadError}<button onClick={()=>void reload()}>Retry</button></div>}
  {loading?<div className="tasks-state">{t("loading")}</div>:!loadError&&filtered.length===0?<div className="tasks-empty"><div className="tasks-empty-icon"><ClipboardList size={24}/></div><h2>{tasks.length===0?t("empty"):t("noMatches")}</h2><p>{tasks.length===0?t("emptyHelp"):""}</p>{tasks.length===0&&canWrite&&<button onClick={()=>setShowForm(true)}><Plus size={16}/>{t("add")}</button>}</div>
   :!loadError&&<div className="tasks-list">{filtered.map(task=>{
    const project=projects.find(item=>item.id===task.projectId);
    const available=[task.status,...transitions[task.status]];
    return <article className="task-card" key={task.id}>
     <div className="task-card-main"><div className="task-card-top"><span className={"task-status "+task.status}>{t(task.status)}</span><span className={"task-priority "+task.priority}>{t(task.priority)}</span></div><h2>{task.title}</h2><p>{task.description||"—"}</p><div className="task-card-meta"><span>{project?.name||t("noProject")}</span><span><CalendarClock size={13}/>{task.dueAt?new Date(task.dueAt).toLocaleDateString(lang==="he"?"he-IL":"en-US"):t("noDue")}</span>{task.assignedAgent&&<span><Bot size={13}/>{agentLabels[task.assignedAgent]?.[lang]||task.assignedAgent}</span>}</div></div>
     <div className="task-card-side">{canWrite?<label className="task-status-editor">{t("status")}<select value={task.status} disabled={updatingId===task.id} onChange={event=>void changeStatus(task,event.target.value as TaskStatus)}>{available.map(status=><option key={status} value={status}>{t(status)}</option>)}</select></label>:<span className={"task-status "+task.status}>{t(task.status)}</span>}<div className="task-card-actions"><button onClick={()=>void toggleDetails(task.id)}>{expandedId===task.id?<ChevronUp size={15}/>:<ChevronDown size={15}/ >}{expandedId===task.id?t("hide"):t("details")}</button>{canWrite&&<button className="task-agent-button" onClick={()=>{setExpandedId(task.id);setAgentTaskId(task.id);setQueueMessage(null);void loadDetails(task.id);}}><Bot size={15}/>{t("ask")}</button>}</div></div>
     {expandedId===task.id&&<div className="task-expanded">
      <div className="task-evidence-grid"><div><b>{t("criteria")}</b><p>{task.acceptanceCriteria||"—"}</p></div><div><b>{t("evidence")}</b><p>{task.latestEvidence||"—"}</p></div><div><b>{t("next")}</b><p>{task.nextAction||"—"}</p></div></div>
      {agentTaskId===task.id&&canWrite&&<form className="task-agent-form" onSubmit={event=>{event.preventDefault();void askAgent(task);}}><h3><Bot size={16}/>{t("ask")}</h3><label>{t("agent")}<select value={agentKey} onChange={event=>setAgentKey(event.target.value)}>{agents.map(agent=><option key={agent} value={agent}>{agentLabels[agent][lang]}</option>)}</select></label><label><textarea required minLength={8} maxLength={12000} rows={3} value={prompt} onChange={event=>setPrompt(event.target.value)} placeholder={t("prompt")}/></label>{queueMessage&&<p className="tasks-queued" role="status">{queueMessage}</p>}{mutationError&&<p className="tasks-error" role="alert">{mutationError}</p>}<button type="submit" disabled={sending||prompt.trim().length<8}>{sending?t("sending"):t("send")}<Send size={14}/></button></form>}
      {detailError&&<p className="tasks-error" role="alert">{detailError}</p>}
      <div className="task-history-grid"><div><h3>{t("history")}</h3>{(requests[task.id]??[]).length===0?<p className="task-muted">{t("noDetails")}</p>:(requests[task.id]??[]).map(request=><div className="task-history-row" key={request.id}><b>{agentLabels[request.agentKey]?.[lang]||request.agentKey}</b><span className={"task-request-status "+request.status}>{agentRequestStatus(request.status)}</span>{request.attemptCount!==undefined&&request.maxAttempts!==undefined&&request.attemptCount>0&&<small className="task-attempt-count">{t("attempt")} {request.attemptCount}/{request.maxAttempts}</small>}<p>{request.prompt}</p>{request.resultSummary&&<small>{request.resultSummary}</small>}</div>)}</div><div><h3>{t("activity")}</h3>{(events[task.id]??[]).length===0?<p className="task-muted">{t("noDetails")}</p>:(events[task.id]??[]).map(item=><div className="task-event-row" key={item.id}><span>{item.toStatus?t(item.toStatus as keyof typeof copy.en):item.eventType}</span><small>{new Date(item.createdAt).toLocaleString(lang==="he"?"he-IL":"en-US")}</small>{item.detail&&<p>{item.detail}</p>}</div>)}</div></div>
     </div>}
    </article>;
   })}</div>}
  {!canWrite&&<p className="tasks-readonly">{t("readonly")}</p>}
 </section>;
}
