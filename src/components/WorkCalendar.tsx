import {useEffect,useMemo,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight,Clock3,FolderKanban} from "lucide-react";
import {getProjects,getTasks,type Project,type WorkItem,type TaskStatus} from "../api";
import {useWorkspace} from "../auth/AuthGate";

const statusKeys:TaskStatus[]=["backlog","ready","in_progress","blocked","review","testing","done"];
const labels={
 en:{title:"Work calendar",subtitle:"A calendar view of project and task deadlines in your workspace.",previous:"Previous month",next:"Next month",today:"Today",dueOn:"Due on",noTasks:"Nothing is due on this day.",month:"Tasks due this month",total:"Scheduled tasks",done:"Completed tasks",loading:"Loading work calendar…",error:"Could not load calendar data.",retry:"Retry",noProject:"No project",backlog:"Backlog",ready:"Ready",in_progress:"In progress",blocked:"Blocked",review:"Review",testing:"Testing",doneStatus:"Done",priority:"Priority",overdue:"Overdue",upcoming:"Upcoming",workOnly:"This calendar currently displays task deadlines. Appointments and external calendar sync are not connected yet."},
 he:{title:"יומן עבודה",subtitle:"תצוגת יומן של תאריכי היעד למשימות ולפרויקטים בסביבת העבודה.",previous:"החודש הקודם",next:"החודש הבא",today:"היום",dueOn:"תאריך יעד",noTasks:"אין משימות לתאריך הזה.",month:"משימות החודש",total:"משימות מתוזמנות",done:"משימות שהושלמו",loading:"טוען את יומן העבודה…",error:"לא ניתן לטעון את נתוני היומן.",retry:"ניסיון נוסף",noProject:"ללא פרויקט",backlog:"בהמתנה",ready:"מוכנה",in_progress:"בתהליך",blocked:"חסומה",review:"לבדיקה",testing:"בבדיקות",doneStatus:"הושלמה",priority:"עדיפות",overdue:"באיחור",upcoming:"בהמשך",workOnly:"היומן מציג כרגע תאריכי יעד של משימות בלבד. פגישות וסנכרון ליומנים חיצוניים עדיין אינם מחוברים."}
};
const weekdays={
 en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
 he:["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"]
};
function keyFor(date:Date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
function dateFromKey(key:string){const [year,month,day]=key.split("-").map(Number);return new Date(year,month-1,day);}
export function WorkCalendar(){
 const {workspace,accessToken}=useWorkspace();
 const [lang,setLang]=useState<"en"|"he">(()=>typeof navigator!=="undefined"&&navigator.language.toLowerCase().startsWith("he")?"he":"en");
 const [tasks,setTasks]=useState<WorkItem[]>([]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [viewDate,setViewDate]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [selectedKey,setSelectedKey]=useState(()=>keyFor(new Date()));
 const rtl=lang==="he";
 const t=(key:keyof typeof labels.en)=>labels[lang][key];
 async function load(){
  if(!workspace?.workspaceId){setTasks([]);setProjects([]);setLoading(false);return;}
  setLoading(true);setError(null);
  try{
   const [taskResult,projectResult]=await Promise.all([getTasks(workspace.workspaceId,accessToken),getProjects(workspace.workspaceId,accessToken)]);
   setTasks(taskResult.items);setProjects(projectResult.items);
  }catch(err){setError(err instanceof Error?err.message:t("error"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[workspace?.workspaceId,accessToken]);
 const monthKey=viewDate.getFullYear()+"-"+String(viewDate.getMonth()+1).padStart(2,"0");
 const monthTitle=viewDate.toLocaleDateString(lang==="he"?"he-IL":"en-US",{month:"long",year:"numeric"});
 const monthTasks=useMemo(()=>tasks.filter(task=>task.dueAt&&keyFor(new Date(task.dueAt)).startsWith(monthKey)),[tasks,monthKey]);
 const gridDays=useMemo(()=>{
  const first=new Date(viewDate.getFullYear(),viewDate.getMonth(),1);
  const start=new Date(first.getFullYear(),first.getMonth(),1-first.getDay());
  return Array.from({length:42},(_,index)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+index));
 },[viewDate]);
 const tasksByDate=useMemo(()=>{
  const grouped=new Map<string,WorkItem[]>();
  for(const task of tasks){
   if(!task.dueAt)continue;
   const key=keyFor(new Date(task.dueAt));
   grouped.set(key,[...(grouped.get(key)??[]),task]);
  }
  return grouped;
 },[tasks]);
 const selectedTasks=tasksByDate.get(selectedKey)??[];
 const todayKey=keyFor(new Date());
 const completedThisMonth=monthTasks.filter(task=>task.status==="done").length;
 function moveMonth(delta:number){
  const next=new Date(viewDate.getFullYear(),viewDate.getMonth()+delta,1);
  setViewDate(next);setSelectedKey(keyFor(next));
 }
 const statusLabel=(status:TaskStatus)=>status==="done"?t("doneStatus"):t(status);
 return <section className="work-calendar" dir={rtl?"rtl":"ltr"}>
  <div className="calendar-heading"><div><div className="calendar-eyebrow"><CalendarDays size={15}/>{t("title")}</div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div><button className="calendar-lang" onClick={()=>setLang(rtl?"en":"he")}>{rtl?"EN":"עב"}</button></div>
  <div className="calendar-summary"><div><strong>{monthTasks.length}</strong><span>{t("month")}</span></div><div><strong>{completedThisMonth}</strong><span>{t("done")}</span></div><div><strong>{tasks.filter(task=>task.dueAt).length}</strong><span>{t("total")}</span></div></div>
  <div className="calendar-layout">
   <section className="calendar-panel">
    <div className="calendar-toolbar"><div><h2>{monthTitle}</h2><button onClick={()=>{setViewDate(new Date());setSelectedKey(todayKey)}}>{t("today")}</button></div><div className="calendar-month-buttons"><button aria-label={t("previous")} onClick={()=>moveMonth(-1)}><ChevronLeft size={17}/></button><button aria-label={t("next")} onClick={()=>moveMonth(1)}><ChevronRight size={17}/></button></div></div>
    <div className="calendar-grid">
     {weekdays[lang].map(day=><div className="calendar-weekday" key={day}>{day}</div>)}
     {gridDays.map(day=>{
      const key=keyFor(day);const dayTasks=tasksByDate.get(key)??[];const inMonth=day.getMonth()===viewDate.getMonth();
      return <button key={key} className={"calendar-day"+(inMonth?"":" outside")+(key===todayKey?" today":"")+(key===selectedKey?" selected":"")} onClick={()=>setSelectedKey(key)} aria-label={day.toLocaleDateString(lang==="he"?"he-IL":"en-US")+", "+dayTasks.length+" tasks"}>
       <span className="calendar-day-number">{day.getDate()}</span>
       {dayTasks.length>0&&<span className="calendar-day-count">{dayTasks.length}</span>}
       <span className="calendar-dots">{dayTasks.slice(0,4).map(task=><i key={task.id} className={"calendar-dot "+task.status}/>)}</span>
      </button>;
     })}
    </div>
    <div className="calendar-legend"><span><i className="calendar-dot active"/>{t("upcoming")}</span><span><i className="calendar-dot done"/>{t("doneStatus")}</span><span><i className="calendar-dot blocked"/>{t("overdue")}</span></div>
   </section>
   <aside className="calendar-day-panel">
    <div className="calendar-day-panel-heading"><div><span>{t("dueOn")}</span><h2>{dateFromKey(selectedKey).toLocaleDateString(lang==="he"?"he-IL":"en-US",{weekday:"long",day:"numeric",month:"long"})}</h2></div><span className="calendar-day-total">{selectedTasks.length}</span></div>
    {loading?<p className="calendar-muted">{t("loading")}</p>:error?<div className="calendar-error" role="alert">{error}<button onClick={()=>void load()}>{t("retry")}</button></div>:selectedTasks.length===0?<div className="calendar-no-tasks"><Clock3 size={21}/><p>{t("noTasks")}</p></div>:<div className="calendar-task-list">{selectedTasks.map(task=>{
     const project=projects.find(item=>item.id===task.projectId);
     return <article className="calendar-task" key={task.id}><div className="calendar-task-head"><span className={"calendar-task-status "+task.status}>{statusLabel(task.status)}</span><span>{task.priority}</span></div><h3>{task.title}</h3><p>{project?.name||t("noProject")}</p><div className="calendar-task-foot"><span>{task.assignedAgent||"ESEKONE"}</span><span>{new Date(task.updatedAt).toLocaleDateString(lang==="he"?"he-IL":"en-US")}</span></div></article>;
    })}</div>}
   </aside>
  </div>
  <p className="calendar-note">{t("workOnly")}</p>
 </section>;
}
