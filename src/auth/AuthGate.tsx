import {useEffect,useState,type ReactNode} from "react";
import type {User} from "oidc-client-ts";
import {apiConfigured,authConfigured,restoreUser,signIn,signOut} from "./index";
import {getCurrentUser,type CurrentUser} from "../api";

type Props={children:ReactNode};
type State={loading:boolean;user:User|null;profile:CurrentUser|null;error:string|null};
export function AuthGate({children}:Props){
 const [state,setState]=useState<State>({loading:true,user:null,profile:null,error:null});
 useEffect(()=>{
  let active=true;
  void (async()=>{
   try{
    const user=await restoreUser();
    if(!active)return;
    if(!user||user.expired){setState({loading:false,user:null,profile:null,error:null});return;}
    const profile=await getCurrentUser(user.access_token);
    if(active)setState({loading:false,user,profile,error:null});
   }catch(error){
    if(active)setState({loading:false,user:null,profile:null,error:error instanceof Error?error.message:"Authentication failed"});
   }
  })();
  return ()=>{active=false};
 },[]);
 const shellStyle={minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f6f7fb",color:"#172033",fontFamily:"Inter,system-ui,sans-serif"} as const;
 const cardStyle={width:"min(100%,560px)",padding:32,background:"#fff",border:"1px solid #e5e8f0",borderRadius:18,boxShadow:"0 12px 40px rgba(20,30,60,.07)"} as const;
 if(!authConfigured||!apiConfigured)return <main style={shellStyle}><section style={cardStyle}><strong style={{letterSpacing:2,color:"#5b67cf"}}>ESEKONE</strong><h1>Workspace connection setup</h1><p>The workspace requires an identity provider and API endpoint before sign-in can be enabled.</p><ul><li>VITE_OIDC_AUTHORITY: {authConfigured?"configured":"missing"}</li><li>VITE_OIDC_CLIENT_ID: {authConfigured?"configured":"missing"}</li><li>VITE_API_BASE_URL: {apiConfigured?"configured":"missing"}</li></ul><p>Configure these environment variables in the ESEKONE-web deployment and register the callback URL <code>/auth/callback</code> with your OIDC provider.</p></section></main>;
 if(state.loading)return <main style={shellStyle}><section style={cardStyle}><strong>ESEKONE</strong><p>Connecting securely to your workspace…</p></section></main>;
 if(!state.user||!state.profile)return <main style={shellStyle}><section style={cardStyle}><strong style={{letterSpacing:2,color:"#5b67cf"}}>ESEKONE</strong><h1>Your business, connected.</h1><p>Sign in with your organization account to open your workspace.</p>{state.error&&<p role="alert" style={{color:"#a33"}}>{state.error}</p>}<button onClick={()=>void signIn()} style={{padding:"12px 18px",border:0,borderRadius:10,background:"#5968e8",color:"#fff",fontWeight:650,cursor:"pointer"}}>Continue with secure sign-in</button></section></main>;
 return <><div style={{padding:"9px 18px",background:"#eef1ff",borderBottom:"1px solid #dfe4ff",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,fontSize:13}}><span>Connected as <b>{state.profile.user.displayName||state.profile.user.email}</b> · {state.profile.workspaces.length} workspace(s) available</span><button onClick={()=>void signOut()} style={{border:0,background:"transparent",color:"#4454bd",cursor:"pointer"}}>Sign out</button></div>{children}</>;
}
