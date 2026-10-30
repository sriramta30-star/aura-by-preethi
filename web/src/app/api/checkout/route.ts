import {NextResponse} from "next/server";
import {createServerSupabase} from "@/lib/supabase-server";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {randomUUID} from "node:crypto";
export const runtime="nodejs";
type CartItem={productId:string;quantity:number;size?:string;color?:string};
type Address={name:string;email:string;phone:string;line1:string;city:string;state:string;pincode:string};
type ReservedItem={product_id:string;quantity:number;name:string;unit_price:number;size:string|null;color:string|null};
function serverDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Database service is not configured.");return createSupabaseClient<any>(url,key,{auth:{autoRefreshToken:false,persistSession:false}});}
type ServiceDb=ReturnType<typeof serverDb>;
export async function POST(request:Request){
 let db:ServiceDb|null=null;
 let reservation:ReservedItem[]|null=null;
 try{
  const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET"];
  if(required.some(key=>!process.env[key]))return NextResponse.json({error:"Online checkout is not enabled. The store owner must configure Supabase and Razorpay in the hosting settings."},{status:503});
  const auth=await createServerSupabase();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in before checkout."},{status:401});
  const body=await request.json() as {items?:CartItem[];shippingAddress?:Address};
  const a=body.shippingAddress;
  const bounded=(value:unknown,max:number)=>typeof value==="string"&&value.trim().length>0&&value.trim().length<=max;
  if(!Array.isArray(body.items)||!body.items.length||body.items.length>20||!a||
    !bounded(a.name,120)||!bounded(a.email,254)||!bounded(a.phone,20)||!bounded(a.line1,240)||!bounded(a.city,100)||!bounded(a.state,100)||!bounded(a.pincode,12)||
    !/^\S+@\S+\.\S+$/.test(a?.email||"")||!/^\+?[0-9]{10,13}$/.test((a?.phone||"").replace(/[\s-]/g,""))||!/^[0-9]{6}$/.test(a?.pincode||""))return NextResponse.json({error:"Enter valid delivery details and review your bag."},{status:400});
  if(body.items.some(x=>!x||typeof x.productId!=="string"||x.productId.length>100||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>20|| (x.size!==undefined&&(typeof x.size!=="string"||x.size.length>20))||(x.color!==undefined&&(typeof x.color!=="string"||x.color.length>40))))return NextResponse.json({error:"A cart item or quantity is invalid."},{status:400});
  const client=serverDb();db=client;const ids=[...new Set(body.items.map(x=>x.productId))];
  const {data:products,error:productError}=await client.from("products").select("id,name,price,stock,active").in("id",ids).eq("active",true);
  if(productError||!products||products.length!==ids.length)return NextResponse.json({error:"Some products are unavailable. Refresh your bag."},{status:409});
  const detail:ReservedItem[]=body.items.map(item=>{const p=products.find(x=>x.id===item.productId);if(!p||Number(p.stock)<item.quantity)throw new Error(`Not enough stock for ${p?.name||"a selected product"}.`);return{product_id:p.id,name:p.name,unit_price:Number(p.price),quantity:item.quantity,size:item.size||null,color:item.color||null};});
  const subtotal=detail.reduce((sum,item)=>sum+item.unit_price*item.quantity,0);const shipping=subtotal>=1999?0:99;const total=Math.round((subtotal+shipping)*100);
  if(!Number.isSafeInteger(total)||total<100)return NextResponse.json({error:"Order total is invalid."},{status:400});
  const {error:reserveError}=await client.rpc("reserve_aura_stock",{p_items:detail});
  if(reserveError)return NextResponse.json({error:"A selected item has just sold out or the store inventory is not configured. Refresh the catalogue and try again."},{status:409});
  reservation=detail;
  const gatewayRes=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount:total,currency:"INR",receipt:`aura_${randomUUID().replaceAll("-","").slice(0,18)}`,notes:{user_id:user.id}}),cache:"no-store"});
  const gateway=await gatewayRes.json() as {id?:string;error?:{description?:string}};
  if(!gatewayRes.ok||!gateway.id){await client.rpc("release_aura_stock",{p_items:reservation});reservation=null;return NextResponse.json({error:gateway.error?.description||"Payment provider could not create an order."},{status:502});}
  const {data:order,error:orderError}=await client.from("orders").insert({user_id:user.id,status:"pending",amount_paise:total,currency:"INR",razorpay_order_id:gateway.id,items:detail,shipping_address:a}).select("id").single();
  if(orderError||!order){await db.rpc("release_aura_stock",{p_items:reservation});reservation=null;return NextResponse.json({error:"We couldn't save the order record. Please contact the store before trying again."},{status:500});}
  reservation=null;
  return NextResponse.json({keyId:process.env.RAZORPAY_KEY_ID,razorpayOrderId:gateway.id,amount:total,currency:"INR",orderId:order.id});
 }catch(error){
  if(db&&reservation){try{await db.rpc("release_aura_stock",{p_items:reservation});}catch{/* preserve original failure */}}
  return NextResponse.json({error:error instanceof Error?error.message:"Checkout could not start."},{status:400});
 }
}
