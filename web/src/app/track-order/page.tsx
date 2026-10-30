import Link from "next/link";
import {redirect} from "next/navigation";
import {createServerSupabase} from "@/lib/supabase-server";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Track your order",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function TrackOrderPage(){
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)return <main className="page-shell"><span className="micro">CUSTOMER CARE</span><h1 className="page-title">Track your order</h1><p className="page-lead">Order tracking activates after the customer account and order database are configured.</p><Link className="text-link" href="/login">Sign in ↗</Link></main>;
 const db=await createServerSupabase();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/track-order");
 const {data:orders,error}=await db.from("orders").select("id,status,amount_paise,currency,created_at,items").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
 return <main className="page-shell"><span className="micro">CUSTOMER CARE</span><h1 className="page-title">Track your order</h1><p className="page-lead">Your order history is private to your account.</p>{error?<p className="form-message">Order history is temporarily unavailable. Please contact store support.</p>:!orders?.length?<div className="empty-state"><h2>No orders yet.</h2><p>Your confirmed orders will appear here after checkout.</p><Link className="primary-button" href="/#shop">Explore collections</Link></div>:<div className="table-scroll"><table className="admin-table"><thead><tr><th>Order reference</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.id.slice(0,8).toUpperCase()}</td><td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td><td>{new Intl.NumberFormat("en-IN",{style:"currency",currency:o.currency||"INR",maximumFractionDigits:0}).format(o.amount_paise/100)}</td><td><span className="status-pill">{o.status}</span></td></tr>)}</tbody></table></div>}</main>;
}
