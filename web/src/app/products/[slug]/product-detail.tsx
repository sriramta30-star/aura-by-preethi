"use client";
import Link from "next/link";
import {useState} from "react";
import {formatINR,type Product} from "@/lib/products";
import {useStore} from "@/components/store-provider";

export default function ProductDetail({product}:{product:Product}){
 const {add,toggleWishlist,wishlist}=useStore();
 const [size,setSize]=useState("");
 const [color,setColor]=useState(product.colors[0]||"");
 const [message,setMessage]=useState("");
 const saved=wishlist.includes(product.id);
 const unavailable=product.stock<=0;
 return <main className="page-shell">
  <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/#shop">{product.category}</Link> / {product.name}</nav>
  <section className="product-detail">
   <img className="detail-image" src={product.image} alt={product.name+" by Aura by Preethi"} />
   <div className="detail-copy">
    <span className="micro">{product.category.toUpperCase()}</span>
    <h1>{product.name}</h1>
    <p className="detail-price">{formatINR(product.price)}{product.compareAt&&<del className="old-price">{formatINR(product.compareAt)}</del>}</p>
    <p className="detail-description">{product.description}</p>
    <p className="detail-description"><b>Fabric:</b> {product.fabric}</p>
    {product.sizes?.length?<label className="field-label">Choose size<select value={size} onChange={e=>{setSize(e.target.value);setMessage("");}}><option value="">Select a size</option>{product.sizes.map(item=><option key={item}>{item}</option>)}</select></label>:null}
    <label className="field-label">Choose colour<select value={color} onChange={e=>setColor(e.target.value)}>{product.colors.map(item=><option key={item}>{item}</option>)}</select></label>
    <div className="detail-options"><span className="status-pill">{unavailable?"Currently unavailable":product.stock<5?"Only a few left":"In stock"}</span></div>
    <div className="quick-actions">
     <button className="primary-button" disabled={unavailable} onClick={()=>{if(product.sizes?.length&&!size){setMessage("Please select a size.");return;}add(product.id,size||undefined,color);setMessage("Added to your shopping bag.");}}>Add to bag</button>
     <button className="secondary-button" onClick={()=>toggleWishlist(product.id)}>{saved?"♥ Saved to wishlist":"♡ Add to wishlist"}</button>
    </div>
    {message&&<p className="form-message" role="status">{message}</p>}
    <p className="muted-note">Product photos and sample stock are illustrative until the store owner uploads and confirms actual inventory. Final delivery and payment options are shown at checkout.</p>
    <Link href="/#shop" className="text-link">← Continue shopping</Link>
   </div>
  </section>
 </main>;
}