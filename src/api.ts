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
