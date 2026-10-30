import {NextResponse} from "next/server";
import {createServerSupabase} from "@/lib/supabase-server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const allowed=["pending","paid","processing","shipped","delivered","cancelled","refunded"];
async function gate(){
 const auth=await createServerSupabase();const {data:{user}}=await auth.auth.getUser();
 if(!user)return {response:NextResponse.json({error:"Sign in first."},{status:401})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {response:NextResponse.json({error:"Admin service is not configured."},{status:503})};
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")return {response:NextResponse.json({error:"Administrator access required."},{status:403})};
 return {db};
}
export async function GET(){
 try{const g=await gate();if("response" in g)return g.response;
 const {data,error}=await g.db.from("orders").select("id,status,amount_paise,currency,created_at,items,user_id").order("created_at",{ascending:false}).limit(100);
 if(error)throw error;return NextResponse.json({orders:data||[]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Orders are temporarily unavailable."},{status:503});}
}
export async function PATCH(request:Request){
 try{const g=await gate();if("response" in g)return g.response;
 const body=await request.json();if(typeof body.id!=="string"||!body.id||!allowed.includes(body.status))return NextResponse.json({error:"Order id or status is invalid."},{status:400});
 const {data:existing,error:readError}=await g.db.from("orders").select("status").eq("id",body.id).maybeSingle();
 if(readError||!existing)return NextResponse.json({error:"Order not found."},{status:404});
 const transitions:Record<string,string[]>={pending:["cancelled"],paid:["processing"],processing:["shipped"],shipped:["delivered"],delivered:[],cancelled:[],refunded:[]};
 if(!transitions[existing.status]?.includes(body.status))return NextResponse.json({error:`Invalid order transition: ${existing.status} to ${body.status}.`},{status:409});
 if(existing.status==="pending"&&body.status==="cancelled"){
   const {data,error}=await g.db.rpc("cancel_aura_order",{p_order_id:body.id});
   if(error||!data)return NextResponse.json({error:"Pending order could not be cancelled or stock released."},{status:409});
   return NextResponse.json({ok:true});
 }
 const {error}=await g.db.from("orders").update({status:body.status,updated_at:new Date().toISOString()}).eq("id",body.id).eq("status",existing.status);
 if(error)return NextResponse.json({error:"Order status couldn't be updated."},{status:400});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Order status couldn't be updated."},{status:503});}
}
