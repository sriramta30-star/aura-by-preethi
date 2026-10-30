import {createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";

type RazorpayWebhook={
 event?:string;
 payload?:{payment?:{entity?:{id?:string;order_id?:string;status?:string}}};
};

export async function POST(request:Request){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!url||!service)return NextResponse.json({error:"Webhook is not configured."},{status:503});
 try{
  const raw=await request.text();
  const signature=request.headers.get("x-razorpay-signature")||"";
  const expected=createHmac("sha256",secret).update(raw).digest();
  const provided=Buffer.from(signature,"hex");
  if(provided.length!==expected.length||!timingSafeEqual(provided,expected)){
   return NextResponse.json({error:"Invalid webhook signature."},{status:400});
  }
  const event=JSON.parse(raw) as RazorpayWebhook;
  if(event.event==="payment.captured"){
   const payment=event.payload?.payment?.entity;
   if(!payment?.order_id||!payment.id)return NextResponse.json({error:"Captured payment payload is incomplete."},{status:400});
   const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
   const {error}=await db.rpc("complete_aura_order",{
    p_razorpay_order_id:payment.order_id,
    p_razorpay_payment_id:payment.id
   });
   if(error)return NextResponse.json({error:"The payment was received but its order could not be finalised."},{status:500});
  }
  // Failed payment attempts remain pending briefly so a shopper can retry.
  // The scheduled expiry function releases stock for abandoned unpaid orders.
  return NextResponse.json({received:true});
 }catch{
  return NextResponse.json({error:"Webhook payload could not be processed."},{status:400});
 }
}