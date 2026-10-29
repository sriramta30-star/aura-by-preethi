"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {demoProducts,formatINR,type Product} from "@/lib/products";
import {useStore} from "@/components/store-provider";

const cats=["All styles","Sarees","Ready-made Blouses","Made-to-stitch"] as const;
type Cat=typeof cats[number];

function ProductCard({product,onQuick}:{product:Product;onQuick:(p:Product)=>void}){
 const {add,wishlist,toggleWishlist}=useStore();
 const saved=wishlist.includes(product.id);
 return <article className="product-card reveal">
  <div className="product-image-wrap"><button className="image-link" onClick={()=>onQuick(product)} aria-label={`View ${product.name}`}><img src={product.image} alt={`${product.name}, ${product.category.toLowerCase()} by Aura by Preethi`} loading="lazy"/></button>
   {product.badge&&<span className="product-badge">{product.badge}</span>}
   <button className={`wishlist ${saved?"saved":""}`} onClick={()=>toggleWishlist(product.id)} type="button" aria-label={saved?"Remove from wishlist":"Save to wishlist"}>{saved?"♥":"♡"}</button>
  </div>
  <div className="product-body"><small>{product.category}</small><h3><button onClick={()=>onQuick(product)}>{product.name}</button></h3>
   <div className="price-row"><strong>{formatINR(product.price)}</strong>{product.compareAt&&<del>{formatINR(product.compareAt)}</del>}</div>
   <div className="swatches">{product.colors.slice(0,4).map((color,i)=><span title={color} aria-label={color} key={color} className={`swatch swatch-${i}`}/>)}</div>
   <button className="add-button" onClick={()=>add(product.id)} type="button">Add to bag <span>＋</span></button>
  </div>
 </article>;
}

function QuickView({product,onClose}:{product:Product;onClose:()=>void}){
 const {add,toggleWishlist,wishlist}=useStore();
 const [size,setSize]=useState("");
 const [color,setColor]=useState(product.colors[0]||"");
 const [msg,setMsg]=useState("");
 useEffect(()=>{function onKey(e:KeyboardEvent){if(e.key==="Escape")onClose()}window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[onClose]);
 return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-title">
   <button className="modal-close" onClick={onClose} aria-label="Close quick view">×</button>
   <img className="quick-photo" src={product.image} alt={product.name}/>
   <div className="quick-copy"><small className="micro">{product.category}</small><h2 id="quick-title">{product.name}</h2><div className="quick-price">{formatINR(product.price)}</div><p>{product.description}</p><p className="fabric"><b>Fabric:</b> {product.fabric}</p>
   {product.sizes?.length?<label className="field-label">Size<select value={size} onChange={e=>setSize(e.target.value)}><option value="">Choose size</option>{product.sizes.map(s=><option key={s}>{s}</option>)}</select></label>:null}
   <label className="field-label">Colour<select value={color} onChange={e=>setColor(e.target.value)}>{product.colors.map(c=><option key={c}>{c}</option>)}</select></label>
   <div className="quick-actions"><button className="primary" onClick={()=>{if(product.sizes?.length&&!size){setMsg("Please choose a size.");return}add(product.id,size||undefined,color);setMsg("Added to your bag.");}}>Add to bag</button><button className="secondary" onClick={()=>toggleWishlist(product.id)}>{wishlist.includes(product.id)?"♥ Saved":"♡ Wishlist"}</button></div>
   {msg&&<p className="status-message" role="status">{msg}</p>}<Link className="text-link" href={`/products/${product.slug}`}>View full product details ↗</Link>
   </div>
  </section>
 </div>;
}

function CartDrawer({onClose}:{onClose:()=>void}){
 const {cart,remove,quantity,cartCount,products}=useStore();
 const lines=cart.map(line=>({line,product:products.find(p=>p.id===line.productId)})).filter((x):x is {line:typeof cart[number];product:Product}=>Boolean(x.product));
 const total=lines.reduce((n,x)=>n+x.product.price*x.line.quantity,0);
 return <div className="drawer-shade" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
   <div className="drawer-head"><div><small className="micro">YOUR SELECTION</small><h2>Your bag <span>({cartCount})</span></h2></div><button onClick={onClose} aria-label="Close bag">×</button></div>
   {!lines.length?<div className="empty-bag"><span>♡</span><h3>Your bag awaits.</h3><p>Discover a piece that feels like you.</p><button className="primary" onClick={onClose}>Continue shopping</button></div>:<>
    <div className="drawer-items">{lines.map(({line,product})=><article className="drawer-item" key={`${line.productId}-${line.size||""}-${line.color||""}`}><img src={product.image} alt={product.name}/><div className="drawer-product"><h3>{product.name}</h3><p>{line.size? `Size ${line.size} · `:""}{line.color||product.category}</p><strong>{formatINR(product.price)}</strong><div className="qty"><button onClick={()=>quantity(product.id,line.size,line.quantity-1)} aria-label="Decrease quantity">−</button><span>{line.quantity}</span><button onClick={()=>quantity(product.id,line.size,line.quantity+1)} aria-label="Increase quantity">＋</button><button className="remove" onClick={()=>remove(product.id,line.size)}>Remove</button></div></div></article>)}</div>
    <div className="drawer-foot"><div className="total-line"><span>Subtotal</span><strong>{formatINR(total)}</strong></div><p>Shipping and delivery options are confirmed at checkout.</p><Link href="/cart" className="primary checkout-link">Continue to checkout ↗</Link><button className="continue-button" onClick={onClose}>Continue shopping</button></div>
   </>}
  </aside>
 </div>;
}

export default function HomePage(){
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<Cat>("All styles");
 const [sort,setSort]=useState("featured");
 const [quick,setQuick]=useState<Product|null>(null);
 const [drawer,setDrawer]=useState(false);
 const {cartCount,wishlist,products}=useStore();
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase();
  const found=products.filter(p=>(category==="All styles"||p.category===category)&&`${p.name} ${p.category} ${p.fabric} ${p.description}`.toLowerCase().includes(q));
  if(sort==="low")found.sort((a,b)=>a.price-b.price);
  if(sort==="high")found.sort((a,b)=>b.price-a.price);
  if(sort==="name")found.sort((a,b)=>a.name.localeCompare(b.name));
  return found;
 },[query,category,sort,products]);
 useEffect(()=>{
  const els=document.querySelectorAll(".reveal");
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){els.forEach(el=>el.classList.add("visible"));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.1});
  els.forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[filtered.length]);
 return <>
  <main>
   <section className="hero">
    <div className="hero-image" role="img" aria-label="Illustrative editorial Indian saree fashion"/>
    <div className="hero-content"><span className="eyebrow">THE AURA EDIT · 2026</span><h1>Elegance,<br/><em>tailored for you.</em></h1><p>Discover timeless sarees, beautifully crafted blouses and designs made just for you.</p><a className="hero-cta" href="#shop">Shop collections <span>↗</span></a><div className="hero-categories">SAREES <i/> READY-MADE BLOUSES <i/> MADE-TO-STITCH</div></div>
    <div className="hero-counter"><span>01</span><i/> 03</div>
   </section>
   <section className="benefits"><div><span>◇</span><p><b>Thoughtfully curated</b><small>Styles picked with care</small></p></div><div><span>♧</span><p><b>Secure checkout</b><small>Configured before launch</small></p></div><div><span>↗</span><p><b>Shipping across India</b><small>Options at checkout</small></p></div><div><span>✳</span><p><b>Personal support</b><small>Made-to-stitch enquiries</small></p></div></section>
   <section className="section categories-section"><header className="section-heading"><span className="micro">DISCOVER YOUR LOOK</span><h2>Shop by category</h2><p>Considered pieces for celebrations, everyday moments and everything in between.</p></header>
    <div className="category-grid">
     <button className="category-tile" onClick={()=>{setCategory("Sarees");document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}}><img src={demoProducts[0].image} alt="Sarees collection" loading="lazy"/><span className="tile-index">01 / THE DRAPE</span><div><h3>Sarees</h3><b>Explore collection ↗</b></div></button>
     <button className="category-tile" onClick={()=>{setCategory("Ready-made Blouses");document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}}><img src={demoProducts[4].image} alt="Ready-made designer blouses" loading="lazy"/><span className="tile-index">02 / THE DETAIL</span><div><h3>Ready-made blouses</h3><b>Find your fit ↗</b></div></button>
     <button className="category-tile" onClick={()=>{setCategory("Made-to-stitch");document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}}><img src={demoProducts[7].image} alt="Made-to-stitch blouse" loading="lazy"/><span className="tile-index">03 / MADE FOR YOU</span><div><h3>Made-to-stitch</h3><b>Customise your blouse ↗</b></div></button>
    </div>
   </section>
   <section className="shop-section section" id="shop"><div className="shop-heading"><div><span className="micro">THE CURRENT EDIT</span><h2>New arrivals</h2><p>Meet the styles you will reach for again and again.</p></div><button className="under-link" onClick={()=>{setCategory("All styles");setQuery("");setSort("featured")}}>View all styles ↗</button></div>
    <div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search sarees, blouses, collections..." aria-label="Search products"/></label><div className="filters"><label className="sr-only" htmlFor="category">Filter by category</label><select id="category" value={category} onChange={e=>setCategory(e.target.value as Cat)}>{cats.map(c=><option key={c}>{c}</option>)}</select><label className="sr-only" htmlFor="sort">Sort products</label><select id="sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Sort by: Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name: A to Z</option></select></div></div>
    {filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} onQuick={setQuick}/>)}</div>:<div className="empty-result"><h3>No styles found</h3><p>Try another search or category.</p><button className="secondary" onClick={()=>{setQuery("");setCategory("All styles")}}>Clear filters</button></div>}
    <p className="catalog-note">Sample catalogue for design review. Prices, stock and product imagery must be verified against real inventory before orders are accepted.</p>
   </section>
   <section className="stitch-feature"><div className="stitch-image"><img src={demoProducts[4].image} alt="Illustrative embroidered blouse detail" loading="lazy"/></div><div className="stitch-copy"><span className="micro">PERSONALISED BY DESIGN</span><h2>Your blouse.<br/><em>Your signature.</em></h2><p>Choose a neckline, sleeves, back style and finish for an outfit that feels personal to you.</p><Link href="/made-to-stitch" className="stitch-cta">Explore custom stitching <span>↗</span></Link></div></section>
   <section id="story" className="brand-story"><div className="story-seal">A</div><div><span className="micro">THE AURA FEELING</span><h2>Curated specially<br/>for you.</h2></div><p>Considered details, beautiful colours and timeless styles for the moments that matter. Find pieces that feel like your own signature.</p></section>
   <section className="newsletter" id="newsletter"><div><span className="micro">A NOTE FROM AURA</span><h2>First to know.<br/><em>Always in style.</em></h2></div><form onSubmit={e=>{e.preventDefault();alert("Newsletter sign-up will activate after the email service is configured.")}}><label htmlFor="newsletter-email">Your email address</label><div><input type="email" id="newsletter-email" required placeholder="you@example.com"/><button type="submit">Join ↗</button></div><small>New arrivals, collections and a little inspiration.</small></form></section>
   <footer id="footer" className="footer"><div className="footer-brand"><img src="/aura-logo.svg" alt="Aura by Preethi"/><p>Curated specially for you.</p></div><div><b>Explore</b><a href="#shop">Sarees</a><a href="#shop">Ready-made blouses</a><Link href="/made-to-stitch">Made-to-stitch</Link></div><div><b>Customer care</b><Link href="/login">My account</Link><Link href="/cart">Shopping bag ({cartCount})</Link><Link href="/track-order">Track an order</Link></div><div><b>Connect</b><a href="mailto:hello@aurabypreethi.example">Contact Aura</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><small className="footer-bottom">© {new Date().getFullYear()} Aura by Preethi · Made with care in India</small></footer>
  </main>
  <button className="floating-bag" onClick={()=>setDrawer(true)} aria-label={`Open shopping bag, ${cartCount} items`}>♧<span>{cartCount}</span></button>
  {quick&&<QuickView product={quick} onClose={()=>setQuick(null)}/>}
  {drawer&&<CartDrawer onClose={()=>setDrawer(false)}/>}
 </>
}
