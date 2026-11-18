import {authConfiguration} from "./auth";
export type WorkspaceSummary={workspaceId:string;workspaceName:string;workspaceSlug:string;organizationId:string;role:string};
export type CurrentUser={user:{id:string;email:string;displayName:string|null};workspaces:WorkspaceSummary[]};
export async function getCurrentUser(accessToken:string):Promise<CurrentUser>{
 if(!authConfiguration.apiBaseUrl)throw new Error("VITE_API_BASE_URL is not configured");
 const response=await fetch(authConfiguration.apiBaseUrl+"/v1/me",{
  headers:{Authorization:"Bearer "+accessToken,Accept:"application/json"}
 });
 if(!response.ok){
  const payload=await response.json().catch(()=>null) as {error?:string}|null;
  throw new Error(payload?.error??"Could not load your ESEKONE account");
 }
 return response.json() as Promise<CurrentUser>;
}
