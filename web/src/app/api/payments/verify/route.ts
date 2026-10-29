import {createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {createServerSupabase} from "@/lib/supabase";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.RAZORPAY_KEY_SECRET,url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!url||!service)return NextResponse.json({error:"Payment verification is not configured."},{status:503});
 try{
  const auth=await createServerSupabase();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Sign in to verify this payment."},{status:401});
  const body=await request.json() as {razorpay_order_id?:string;razorpay_payment_id?:string;razorpay_signature?:string};
  const {razorpay_order_id:orderId,razorpay_payment_id:paymentId,razorpay_signature:signature}=body;
  if(!orderId||!paymentId||!signature||![orderId,paymentId,signature].every(v=>typeof v==="string"&&v.length>0))return NextResponse.json({error:"Payment confirmation is incomplete."},{status:400});
  const expected=createHmac("sha256",secret).update(`${orderId}|${paymentId}`).digest();
  const provided=Buffer.from(signature,"hex");if(provided.length!==expected.length||!timingSafeEqual(provided,expected))return NextResponse.json({error:"Payment signature could not be verified."},{status:400});
  const db=createSupabaseClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:order,error}=await db.from("orders").select("id,status").eq("razorpay_order_id",orderId).eq("user_id",user.id).maybeSingle();
  if(error||!order)return NextResponse.json({error:"No matching order was found for this account."},{status:404});
  if(order.status==="paid")return NextResponse.json({ok:true,orderId:order.id,message:"Payment was already verified."});
  const {data:confirmed,error:rpcError}=await db.rpc("complete_aura_order",{p_razorpay_order_id:orderId,p_razorpay_payment_id:paymentId});
  if(rpcError||!confirmed)return NextResponse.json({error:"Payment was signed but the order could not be finalised. Contact the store with your payment reference."},{status:500});
  return NextResponse.json({ok:true,orderId:order.id,message:"Payment verified successfully."});
 }catch{return NextResponse.json({error:"Payment verification failed. If your account was debited, contact store support before retrying."},{status:400});}
}
