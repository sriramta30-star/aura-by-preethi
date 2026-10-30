"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {createBrowserSupabase} from "@/lib/supabase-browser";

export default function LoginPage(){
 const [mode,setMode]=useState<"signin"|"signup">("signin"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const router=useRouter(),params=useSearchParams();
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");
 try{const client=createBrowserSupabase();const result=mode==="signin"?await client.auth.signInWithPassword({email,password}):await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/login"}});
 if(result.error)throw result.error;
 if(mode==="signup"&&!result.data.session){setMessage("Check your email to confirm your account before signing in.");}
 else{router.push(params.get("next")==="/admin"?"/admin":"/cart");router.refresh();}
 }catch(err){setMessage(err instanceof Error?err.message:"Account service has not been configured yet.");}finally{setBusy(false);}}
 return <main className="page-shell account-page"><span className="micro">YOUR AURA ACCOUNT</span><h1 className="page-title">{mode==="signin"?"Welcome back.":"Create your account."}</h1><p className="page-lead">Sign in to manage your details and view your shopping history. Customer accounts activate when the store database is connected.</p>
 <form className="account-form" onSubmit={submit}><div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode==="signin"?"current-password":"new-password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></div><button className="primary-button" type="submit" disabled={busy}>{busy?"Please wait...":mode==="signin"?"Sign in":"Create account"}</button>{message&&<p className="form-message" role="status">{message}</p>}<button className="text-button" type="button" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("");}}>{mode==="signin"?"New to Aura? Create an account":"Already registered? Sign in"}</button><p className="muted-note"><Link href="/">← Back to shopping</Link></p></form></main>;
}
