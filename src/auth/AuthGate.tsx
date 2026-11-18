import {createContext,useContext,useEffect,useState,type ReactNode,type FormEvent} from "react";
import type {User} from "oidc-client-ts";
import {apiConfigured,authConfigured,restoreUser,signIn,signOut} from "./index";
import {createWorkspace,getCurrentUser,getWorkspaceOverview,type CurrentUser,type WorkspaceOverview,type WorkspaceSummary} from "../api";

type Props={children:ReactNode};
type State={loading:boolean;user:User|null;profile:CurrentUser|null;overview:WorkspaceOverview|null;overviewError:string|null;error:string|null};
type WorkspaceContextValue={profile:CurrentUser;workspace:WorkspaceSummary|null;overview:WorkspaceOverview|null;overviewError:string|null};
const WorkspaceContext=createContext<WorkspaceContextValue|null>(null);
export function useWorkspace(){const value=useContext(WorkspaceContext);if(!value)throw new Error("useWorkspace must be used inside AuthGate");return value;}

export function AuthGate({children}:Props){
 const [state,setState]=useState<State>({loading:true,user:null,profile:null,overview:null,overviewError:null,error:null});
 useEffect(()=>{
  let active=true;
  void (async()=>{
   try{
    const user=await restoreUser();
    if(!active)return;
    if(!user||user.expired){setState({loading:false,user:null,profile:null,overview:null,overviewError:null,error:null});return;}
    const profile=await getCurrentUser(user.access_token);
    let overview:WorkspaceOverview|null=null;
    let overviewError:string|null=null;
    const workspace=profile.workspaces[0]??null;
    if(workspace){try{overview=await getWorkspaceOverview(workspace.workspaceId,user.access_token);}catch(error){overviewError=error instanceof Error?error.message:"Could not load workspace overview";}}
    if(active)setState({loading:false,user,profile,overview,overviewError,error:null});
   }catch(error){
    if(active)setState({loading:false,user:null,profile:null,overview:null,overviewError:null,error:error instanceof Error?error.message:"Authentication failed"});
   }
  })();
  return ()=>{active=false};
 },[]);
 const shellStyle={minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f6f7fb",color:"#172033",fontFamily:"Inter,system-ui,sans-serif"} as const;
 const cardStyle={width:"min(100%,560px)",padding:32,background:"#fff",border:"1px solid #e5e8f0",borderRadius:18,boxShadow:"0 12px 40px rgba(20,30,60,.07)"} as const;
 if(!authConfigured||!apiConfigured)return <main style={shellStyle}><section style={cardStyle}><strong style={{letterSpacing:2,color:"#5b67cf"}}>ESEKONE</strong><h1>Workspace connection setup</h1><p>The workspace requires an identity provider and API endpoint before sign-in can be enabled.</p><ul><li>VITE_OIDC_AUTHORITY: {authConfigured?"configured":"missing"}</li><li>VITE_OIDC_CLIENT_ID: {authConfigured?"configured":"missing"}</li><li>VITE_API_BASE_URL: {apiConfigured?"configured":"missing"}</li></ul><p>Configure these environment variables in the ESEKONE-web deployment and register the callback URL <code>/auth/callback</code> with your OIDC provider.</p></section></main>;
 if(state.loading)return <main style={shellStyle}><section style={cardStyle}><strong>ESEKONE</strong><p>Connecting securely to your workspace…</p></section></main>;
 if(!state.user||!state.profile)return <main style={shellStyle}><section style={cardStyle}><strong style={{letterSpacing:2,color:"#5b67cf"}}>ESEKONE</strong><h1>Your business, connected.</h1><p>Sign in with your organization account to open your workspace.</p>{state.error&&<p role="alert" style={{color:"#a33"}}>{state.error}</p>}<button onClick={()=>void signIn()} style={{padding:"12px 18px",border:0,borderRadius:10,background:"#5968e8",color:"#fff",fontWeight:650,cursor:"pointer"}}>Continue with secure sign-in</button></section></main>;
 if(state.profile.workspaces.length===0)return <OnboardingCard accessToken={state.user.access_token} onCreated={()=>window.location.reload()}/>;
 const workspace=state.profile.workspaces[0]??null;
 return <WorkspaceContext.Provider value={{profile:state.profile,workspace,overview:state.overview,overviewError:state.overviewError}}><><div style={{padding:"9px 18px",background:"#eef1ff",borderBottom:"1px solid #dfe4ff",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,fontSize:13}}><span>Connected as <b>{state.profile.user.displayName||state.profile.user.email}</b> · {state.profile.workspaces.length} workspace(s) available</span><button onClick={()=>void signOut()} style={{border:0,background:"transparent",color:"#4454bd",cursor:"pointer"}}>Sign out</button></div>{children}</></WorkspaceContext.Provider>;
}
function OnboardingCard({accessToken,onCreated}:{accessToken:string;onCreated:()=>void}){
 const [organizationName,setOrganizationName]=useState("");
 const [organizationSlug,setOrganizationSlug]=useState("");
 const [workspaceName,setWorkspaceName]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError(null);
  try{await createWorkspace(accessToken,{organizationName,organizationSlug,workspaceName:workspaceName||organizationName,workspaceSlug:organizationSlug});onCreated();}
  catch(e){setError(e instanceof Error?e.message:"Could not create workspace");setBusy(false);}
 }
 const style={minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f6f7fb",color:"#172033",fontFamily:"Inter,system-ui,sans-serif"} as const;
 const field={display:"block",width:"100%",padding:12,marginTop:6,border:"1px solid #d9deea",borderRadius:8} as const;
 return <main style={style}><form onSubmit={submit} style={{width:"min(100%,560px)",padding:32,background:"#fff",border:"1px solid #e5e8f0",borderRadius:18}}><strong style={{letterSpacing:2,color:"#5b67cf"}}>ESEKONE</strong><h1>Create your business workspace</h1><p>Start by setting up your organization. You can configure additional workspaces and modules later.</p><label style={{display:"block",marginTop:16}}>Organization name<input required minLength={2} maxLength={120} value={organizationName} onChange={e=>setOrganizationName(e.target.value)} style={field}/></label><label style={{display:"block",marginTop:16}}>Organization URL slug<input required minLength={2} maxLength={60} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={organizationSlug} onChange={e=>setOrganizationSlug(e.target.value)} placeholder="your-business" style={field}/></label><label style={{display:"block",marginTop:16}}>Workspace name<input maxLength={120} value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Use organization name" style={field}/></label>{error&&<p role="alert" style={{color:"#a33"}}>{error}</p>}<button disabled={busy||organizationSlug.length<2} style={{marginTop:20,padding:"12px 18px",border:0,borderRadius:10,background:"#5968e8",color:"#fff",fontWeight:650,cursor:"pointer"}}>{busy?"Creating…":"Create workspace"}</button></form></main>;
}
