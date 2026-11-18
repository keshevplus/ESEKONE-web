import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

const env=import.meta.env;
export const authConfiguration={
 authority:env.VITE_OIDC_AUTHORITY??"",
 clientId:env.VITE_OIDC_CLIENT_ID??"",
 apiBaseUrl:(env.VITE_API_BASE_URL??"").replace(/\/$/,"")
};
export const authConfigured=Boolean(authConfiguration.authority&&authConfiguration.clientId);
export const apiConfigured=Boolean(authConfiguration.apiBaseUrl);

let manager:UserManager|null=null;
export function getUserManager(){
 if(!authConfigured)return null;
 if(!manager)manager=new UserManager({
  authority:authConfiguration.authority,
  client_id:authConfiguration.clientId,
  redirect_uri:window.location.origin+"/auth/callback",
  post_logout_redirect_uri:window.location.origin+"/",
  response_type:"code",
  scope:"openid profile email",
  userStore:new WebStorageStateStore({store:window.sessionStorage}),
  monitorSession:false
 });
 return manager;
}
export async function restoreUser():Promise<User|null>{
 const client=getUserManager();
 if(!client)return null;
 if(window.location.pathname==="/auth/callback"){
  const user=await client.signinRedirectCallback();
  window.history.replaceState({},document.title,"/");
  return user;
 }
 return client.getUser();
}
export async function signIn(){
 const client=getUserManager();
 if(!client)throw new Error("OIDC sign-in is not configured");
 await client.signinRedirect();
}
export async function signOut(){
 const client=getUserManager();
 if(!client)return;
 await client.signoutRedirect();
}
