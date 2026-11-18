import {authConfiguration} from "./auth";
export type WorkspaceSummary={workspaceId:string;workspaceName:string;workspaceSlug:string;organizationId:string;role:string};
export type CurrentUser={user:{id:string;email:string;displayName:string|null};workspaces:WorkspaceSummary[]};
export type WorkspaceOverview={
 generatedAt:string;
 metrics:{contactsTotal:number;customersTotal:number;projectsTotal:number;activeProjects:number;openTasks:number;tasksDueToday:number};
 recentTasks:Array<{id:string;title:string;status:string;priority:string;dueAt:string|null;updatedAt:string}>;
 recentContacts:Array<{id:string;fullName:string;status:string;company:string|null;createdAt:string}>;
};
async function apiFetch<T>(path:string,accessToken:string,init:RequestInit={}):Promise<T>{
 if(!authConfiguration.apiBaseUrl)throw new Error("VITE_API_BASE_URL is not configured");
 const response=await fetch(authConfiguration.apiBaseUrl+path,{...init,headers:{Accept:"application/json",Authorization:"Bearer "+accessToken,...(init.body?{"content-type":"application/json"}:{}),...init.headers}});
 if(!response.ok){const payload=await response.json().catch(()=>null) as {error?:string}|null;throw new Error(payload?.error??"ESEKONE API request failed ("+response.status+")");}
 return response.json() as Promise<T>;
}
export function getCurrentUser(accessToken:string){return apiFetch<CurrentUser>("/v1/me",accessToken);}
export function getWorkspaceOverview(workspaceId:string,accessToken:string){return apiFetch<WorkspaceOverview>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/overview",accessToken);}
export function createWorkspace(accessToken:string,input:{organizationName:string;organizationSlug:string;workspaceName:string;workspaceSlug:string}){return apiFetch<{workspace:{id:string}}>("/v1/onboarding/workspaces",accessToken,{method:"POST",body:JSON.stringify(input)});}

export type ContactStatus="lead"|"customer"|"inactive";
export type Contact={
 id:string;workspaceId:string;fullName:string;email:string|null;phone:string|null;company:string|null;
 status:ContactStatus;createdAt:string;updatedAt:string;
};
export type ContactInput={fullName:string;email:string|null;phone:string|null;company:string|null;status:ContactStatus};
export function getContacts(workspaceId:string,accessToken:string){
 return apiFetch<{items:Contact[];limit:number;offset:number}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/contacts?limit=100&offset=0",accessToken);
}
export function createContact(workspaceId:string,accessToken:string,input:ContactInput){
 return apiFetch<{contact:Contact}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/contacts",accessToken,{method:"POST",body:JSON.stringify(input)});
}
export function updateContact(workspaceId:string,contactId:string,accessToken:string,input:Partial<ContactInput>){
 return apiFetch<{contact:Contact}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/contacts/"+encodeURIComponent(contactId),accessToken,{method:"PATCH",body:JSON.stringify(input)});
}

export type ProjectStatus="planned"|"active"|"on_hold"|"completed"|"archived";
export type Project={
 id:string;workspaceId:string;name:string;description:string|null;status:ProjectStatus;
 ownerUserId:string|null;startAt:string|null;dueAt:string|null;
 createdByUserId:string|null;createdAt:string;updatedAt:string;
};
export type ProjectInput={name:string;description:string|null;status:"planned"|"active"};
export type ProjectUpdate={name?:string;description?:string|null;status?:ProjectStatus};
export function getProjects(workspaceId:string,accessToken:string){
 return apiFetch<{items:Project[];limit:number;offset:number}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects?limit=100&offset=0",accessToken);
}
export function createProject(workspaceId:string,accessToken:string,input:ProjectInput){
 return apiFetch<{project:Project}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects",accessToken,{method:"POST",body:JSON.stringify(input)});
}
export function updateProject(workspaceId:string,projectId:string,accessToken:string,input:ProjectUpdate){
 return apiFetch<{project:Project}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects/"+encodeURIComponent(projectId),accessToken,{method:"PATCH",body:JSON.stringify(input)});
}

export type TaskStatus="backlog"|"ready"|"in_progress"|"blocked"|"review"|"testing"|"done";
export type TaskPriority="low"|"normal"|"high"|"urgent";
export type WorkItem={
 id:string;workspaceId:string;projectId:string|null;title:string;description:string|null;status:TaskStatus;
 priority:TaskPriority;dueAt:string|null;assignedUserId:string|null;assignedAgent:string|null;
 acceptanceCriteria:string|null;latestEvidence:string|null;nextAction:string|null;
 createdByUserId:string|null;createdAt:string;updatedAt:string;
};
export type TaskInput={
 title:string;description:string|null;priority:TaskPriority;dueAt:string|null;projectId:string|null;
 assignedAgent:string|null;acceptanceCriteria:string|null;
};
export type TaskUpdate={title?:string;description?:string|null;status?:TaskStatus;priority?:TaskPriority;dueAt?:string|null;projectId?:string|null;assignedAgent?:string|null;acceptanceCriteria?:string|null;latestEvidence?:string|null;nextAction?:string|null};
export type AgentRequest={
 id:string;agentKey:string;status:string;prompt:string;resultSummary:string|null;
 createdAt:string;startedAt:string|null;completedAt:string|null;
};
export type TaskEvent={
 id:string;workspaceId:string;workItemId:string;actorUserId:string|null;eventType:string;
 fromStatus:string|null;toStatus:string|null;detail:string|null;createdAt:string;
};
export function getTasks(workspaceId:string,accessToken:string){
 return apiFetch<{items:WorkItem[];limit:number;offset:number}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks?limit=100&offset=0",accessToken);
}
export function createTask(workspaceId:string,accessToken:string,input:TaskInput){
 return apiFetch<{item:WorkItem}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks",accessToken,{method:"POST",body:JSON.stringify(input)});
}
export function updateTask(workspaceId:string,taskId:string,accessToken:string,input:TaskUpdate){
 return apiFetch<{item:WorkItem}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks/"+encodeURIComponent(taskId),accessToken,{method:"PATCH",body:JSON.stringify(input)});
}
export function createAgentRequest(workspaceId:string,taskId:string,accessToken:string,input:{prompt:string;agentKey:string}){
 return apiFetch<{request:{id:string;status:string;agentKey:string;createdAt:string};message:string}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks/"+encodeURIComponent(taskId)+"/agent-requests",accessToken,{method:"POST",body:JSON.stringify(input)});
}
export function getAgentRequests(workspaceId:string,taskId:string,accessToken:string){
 return apiFetch<{requests:AgentRequest[]}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks/"+encodeURIComponent(taskId)+"/agent-requests",accessToken);
}
export function getTaskEvents(workspaceId:string,taskId:string,accessToken:string){
 return apiFetch<{events:TaskEvent[]}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/tasks/"+encodeURIComponent(taskId)+"/events",accessToken);
}
