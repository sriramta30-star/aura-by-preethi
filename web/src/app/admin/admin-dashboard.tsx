"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {demoProducts,formatINR} from "@/lib/products";

type AdminProduct={id:string;slug:string;name:string;category:string;price:number|string;stock:number;image:string;active:boolean;created_at?:string};
type AdminOrder={id:string;status:string;amount_paise:number;currency:string;created_at:string;items:unknown[];user_id:string};
type FormState={name:string;slug:string;category:string;price:string;stock:string;fabric:string;image:string;description:string;colors:string;sizes:string};
const blankForm:FormState={name:"",slug:"",category:"Sarees",price:"",stock:"1",fabric:"",image:demoProducts[0].image,description:"",colors:"Maroon, Gold",sizes:""};
const nextStatuses:Record<string,string[]>={pending:["cancelled"],paid:["processing"],processing:["shipped"],shipped:["delivered"],delivered:[],cancelled:[],refunded:[]};
const money=(amount:number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:0}).format(amount/100);
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
export default function AdminDashboard(){
 const [products,setProducts]=useState<AdminProduct[]>([]);
 const [orders,setOrders]=useState<AdminOrder[]>([]);
 const [form,setForm]=useState<FormState>(blankForm);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [accessDenied,setAccessDenied]=useState(false);
 const refresh=useCallback(async()=>{
  setLoading(true);setError("");setAccessDenied(false);
  try{
   const [pr,or]=await Promise.all([fetch("/api/admin/products",{cache:"no-store"}),fetch("/api/admin/orders",{cache:"no-store"})]);
   const pd=await pr.json();const od=await or.json();
   if(pr.status===401||pr.status===403||or.status===401||or.status===403){setAccessDenied(true);setError(pd.error||od.error||"Administrator access is required.");return;}
   if(!pr.ok||!or.ok)throw new Error(pd.error||od.error||"The administration service is not ready.");
   setProducts(pd.products||[]);setOrders(od.orders||[]);
  }catch(e){setError(e instanceof Error?e.message:"The dashboard could not load.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function createProduct(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{
   const payload={...form,slug:form.slug||slugify(form.name),price:Number(form.price),stock:Number(form.stock),colors:form.colors.split(",").map(x=>x.trim()).filter(Boolean),sizes:form.sizes.split(",").map(x=>x.trim()).filter(Boolean)};
   const response=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Product could not be saved.");
   setForm(blankForm);setNotice("Product added to the catalogue.");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Product could not be saved.");}
  finally{setSaving(false);}
 }
 async function deactivate(id:string){
  if(!window.confirm("Remove this product from the public catalogue?"))return;
  setError("");setNotice("");
  try{const response=await fetch("/api/admin/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Product could not be deactivated.");setNotice("Product hidden from the public catalogue.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Product could not be deactivated.");}
 }
 async function updateOrder(id:string,status:string){
  setError("");setNotice("");
  try{const response=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Order status could not be updated.");setNotice("Order status updated.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Order status could not be updated.");}
 }
 return <main className="page-shell">
  <nav className="breadcrumb"><Link href="/">Aura storefront</Link> / Administration</nav>
  <span className="micro">STORE OPERATIONS</span><h1 className="page-title">Aura administration</h1>
  <p className="page-lead">Manage catalogue visibility, stock and order progress. This area is protected by server-side administrator checks.</p>
  {error&&<p className="form-message" role="alert">{error}</p>}{notice&&<p className="status-message" role="status">{notice}</p>}
  {accessDenied?<section className="admin-section"><h2>Administrator access required</h2><p className="muted-note">Sign in with your verified store-owner account. A Supabase administrator must assign that account the admin role in the profiles table before this dashboard will open.</p><Link className="primary-button" href="/login?next=/admin">Sign in</Link><p className="muted-note">Do not promote an account until its email ownership has been verified.</p></section>:<>
   {loading?<p>Loading store data...</p>:<div className="admin-stack">
    <section className="admin-section"><h2>Store overview</h2><div className="benefits"><div><p><b>{products.filter(p=>p.active).length}</b><small>Active products</small></p></div><div><p><b>{products.filter(p=>p.active&&p.stock<5).length}</b><small>Low stock</small></p></div><div><p><b>{orders.length}</b><small>Recent orders</small></p></div></div></section>
    <section className="admin-section"><h2>Add a product</h2><form className="admin-form" onSubmit={createProduct}>
     <div className="form-field"><label htmlFor="p-name">Product name</label><input id="p-name" required minLength={2} maxLength={140} value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value,slug:slugify(e.target.value)}))}/></div>
     <div className="form-field"><label htmlFor="p-slug">URL slug</label><input id="p-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm(v=>({...v,slug:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-category">Category</label><select id="p-category" value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}><option>Sarees</option><option>Ready-made Blouses</option><option>Made-to-stitch</option></select></div>
     <div className="form-field"><label htmlFor="p-price">Price (INR)</label><input id="p-price" type="number" min="1" step="1" required value={form.price} onChange={e=>setForm(v=>({...v,price:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-stock">Available stock</label><input id="p-stock" type="number" min="0" step="1" required value={form.stock} onChange={e=>setForm(v=>({...v,stock:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-fabric">Fabric</label><input id="p-fabric" maxLength={120} value={form.fabric} onChange={e=>setForm(v=>({...v,fabric:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-image">Image URL (HTTPS)</label><input id="p-image" type="url" required value={form.image} onChange={e=>setForm(v=>({...v,image:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-colors">Colours (comma separated)</label><input id="p-colors" value={form.colors} onChange={e=>setForm(v=>({...v,colors:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-sizes">Sizes (comma separated, optional)</label><input id="p-sizes" value={form.sizes} onChange={e=>setForm(v=>({...v,sizes:e.target.value}))}/></div>
     <div className="form-field"><label htmlFor="p-description">Description</label><textarea id="p-description" rows={4} maxLength={2000} value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))}/></div>
     <button className="primary-button" type="submit" disabled={saving}>{saving?"Saving...":"Add product"}</button>
    </form></section>
    <section className="admin-section"><h2>Product catalogue</h2><div className="table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Action</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.name}<small>{p.slug}</small></td><td>{p.category}</td><td>{formatINR(Number(p.price))}</td><td>{p.stock}</td><td><span className="status-pill">{p.active?"Active":"Hidden"}</span></td><td>{p.active?<button className="text-button" type="button" onClick={()=>deactivate(p.id)}>Hide product</button>:"Hidden"}</td></tr>)}</tbody></table></div></section>
    <section className="admin-section"><h2>Recent orders</h2>{!orders.length?<p className="muted-note">No orders have been placed yet.</p>:<div className="table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Next action</th></tr></thead><tbody>{orders.map(o=>{const next=nextStatuses[o.status]||[];return <tr key={o.id}><td>{o.id.slice(0,8).toUpperCase()}<small>User {o.user_id.slice(0,8)}</small></td><td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td><td>{Array.isArray(o.items)?o.items.map((item,index)=>{const value=item as {name?:string;quantity?:number};return <small key={index}>{value.name||"Item"} × {value.quantity||1}</small>}):"Order items"}</td><td>{money(o.amount_paise,o.currency)}</td><td><span className="status-pill">{o.status}</span></td><td>{next.length?<select aria-label={"Next status for order "+o.id} value="" onChange={e=>{if(e.target.value)void updateOrder(o.id,e.target.value);}}><option value="">Choose...</option>{next.map(status=><option key={status} value={status}>{status}</option>)}</select>:"No action"}</td></tr>})}</tbody></table></div>}</section>
   </div>}
  </>}
  <p className="muted-note">Payment refunds, shipment-label generation and customer notifications are not automated by this dashboard. Verify each provider action separately before changing an order's status.</p>
 </main>;
}