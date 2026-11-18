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
export function getProjects(workspaceId:string,accessToken:string){
 return apiFetch<{items:Project[];limit:number;offset:number}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects?limit=100&offset=0",accessToken);
}
export function createProject(workspaceId:string,accessToken:string,input:ProjectInput){
 return apiFetch<{project:Project}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects",accessToken,{method:"POST",body:JSON.stringify(input)});
}
export function updateProject(workspaceId:string,projectId:string,accessToken:string,input:Partial<ProjectInput>){
 return apiFetch<{project:Project}>("/v1/workspaces/"+encodeURIComponent(workspaceId)+"/projects/"+encodeURIComponent(projectId),accessToken,{method:"PATCH",body:JSON.stringify(input)});
}
