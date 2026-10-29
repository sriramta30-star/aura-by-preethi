"use client";
import Link from "next/link";
import Script from "next/script";
import {useMemo,useState} from "react";
import {formatINR} from "@/lib/products";
import {useStore} from "@/components/store-provider";

declare global { interface Window { Razorpay?: new (options:Record<string,unknown>)=>{open:()=>void}; } }
type Address={name:string;email:string;phone:string;line1:string;city:string;state:string;pincode:string};
export default function CartPage(){
 const {cart,loaded,remove,quantity,clear,products}=useStore();
 const [address,setAddress]=useState<Address>({name:"",email:"",phone:"",line1:"",city:"",state:"",pincode:""});
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const lines=useMemo(()=>cart.map(line=>({line,product:products.find(p=>p.id===line.productId)})).filter((v):v is {line:typeof cart[number];product:(typeof demoProducts)[number]}=>Boolean(v.product)),[cart]);
 const subtotal=lines.reduce((n,x)=>n+x.product.price*x.line.quantity,0);const shipping=subtotal===0||subtotal>=1999?0:99;
 function set<K extends keyof Address>(key:K,value:Address[K]){setAddress(v=>({...v,[key]:value}));}
 async function pay(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:lines.map(x=>({productId:x.line.productId,quantity:x.line.quantity,size:x.line.size,color:x.line.color})),shippingAddress:address})});
   const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Checkout is not configured yet.");
   if(!window.Razorpay)throw new Error("Secure checkout failed to load. Please try again.");
   const widget=new window.Razorpay({key:payload.keyId,amount:payload.amount,currency:payload.currency,name:"Aura by Preethi",description:"Fashion order",order_id:payload.razorpayOrderId,prefill:{name:address.name,email:address.email,contact:address.phone},theme:{color:"#741b32"},handler:async(result:Record<string,string>)=>{
    const verification=await fetch("/api/payments/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(result)});const verified=await verification.json();
    if(!verification.ok){setMessage(verified.error||"Payment verification failed. Please contact support before retrying.");return;}
    setMessage("Payment verified successfully. Order reference: "+verified.orderId);clear();
   }});
   widget.open();
  }catch(error){setMessage(error instanceof Error?error.message:"Checkout could not start.");}
  finally{setBusy(false);}
 }
 if(!loaded)return <main className="page-shell"><p>Loading your bag...</p></main>;
 return <main className="page-shell"><span className="micro">YOUR SELECTION</span><h1 className="page-title">Your bag <span className="cart-count-title">({cart.reduce((n,x)=>n+x.quantity,0)})</span></h1>
 {!lines.length?<div className="empty-state"><h2>Your bag is waiting for something beautiful.</h2><p>Discover sarees, ready-made blouses and made-to-stitch styles.</p><Link className="primary-button" href="/#shop">Continue shopping ↗</Link></div>:
 <div className="cart-layout"><section className="cart-lines">{lines.map(({line,product})=><article className="cart-line" key={line.productId+":"+(line.size||"")+(line.color||"")}><Link href={`/#shop`}><img src={product.image} alt={product.name}/></Link><div><h2>{product.name}</h2><p>{line.size?`Size ${line.size} · `:""}{line.color||product.category}</p><strong>{formatINR(product.price)}</strong><div className="cart-quantity"><button onClick={()=>quantity(product.id,line.size,line.quantity-1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button onClick={()=>quantity(product.id,line.size,line.quantity+1)} aria-label="Increase quantity">+</button><button className="cart-remove" onClick={()=>remove(product.id,line.size)}>Remove</button></div></div><b>{formatINR(product.price*line.quantity)}</b></article>)}</section>
 <aside className="order-summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div><div className="summary-line"><span>Shipping estimate</span><span>{shipping?formatINR(shipping):"Complimentary"}</span></div><div className="summary-line summary-total"><strong>Estimated total</strong><strong>{formatINR(subtotal+shipping)}</strong></div><p className="muted-note">Actual delivery options, stock and prices must be confirmed with the store before launch.</p>
 <form onSubmit={pay}><h3>Delivery details</h3>{([["name","Full name","text"],["email","Email address","email"],["phone","Mobile number","tel"],["line1","Street address","text"],["city","City","text"],["state","State","text"],["pincode","PIN code","text"]] as const).map(([key,label,type])=><div className="form-field" key={key}><label htmlFor={key}>{label}</label><input id={key} type={type} required value={address[key]} onChange={e=>set(key,e.target.value)} autoComplete={key==="name"?"name":key==="email"?"email":key==="phone"?"tel":key==="pincode"?"postal-code":"street-address"}/></div>)}
 <button className="primary-button" style={{width:"100%"}} type="submit" disabled={busy}>{busy?"Starting secure checkout...":"Proceed to payment"}</button><p className="muted-note">Requires verified customer sign-in and live Supabase and Razorpay setup. Never send payment credentials through this form.</p>{message&&<p role="status" className="form-message">{message}</p>}</form></aside></div>}
 <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"/></main>;
}
