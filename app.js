const DEFAULT=[
{id:"c1",name:"Porsche 911 GT3 RS",brand:"Porsche",category:"Performance",price:349,seats:2,transmission:"Automatic",fuel:"Petrol",color:"Black",plate:"HS 001 HR",available:true,image:"assets/porsche-snow.png",description:"A road-focused icon engineered for precision, emotion, and unforgettable alpine routes."},
{id:"c2",name:"Mercedes-AMG GT 63",brand:"Mercedes-AMG",category:"Grand Touring",price:289,seats:4,transmission:"Automatic",fuel:"Hybrid",color:"Obsidian",plate:"HS 063 HR",available:true,image:"https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1400&q=88",description:"A luxurious grand tourer with serious performance and effortless comfort."},
{id:"c3",name:"BMW M4 Competition",brand:"BMW M",category:"Performance",price:239,seats:4,transmission:"Automatic",fuel:"Petrol",color:"Green",plate:"HS 004 HR",available:true,image:"https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=88",description:"A performance coupé balancing daily usability with sharp response."},
{id:"c4",name:"Audi RS e-tron GT",brand:"Audi Sport",category:"Electric",price:259,seats:5,transmission:"Automatic",fuel:"Electric",color:"Grey",plate:"HS 007 HR",available:true,image:"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=88",description:"Electric grand touring with immediate acceleration and understated presence."}
];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(key,legacyKey,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||localStorage.getItem(legacyKey))??fallback}catch{return fallback}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const money=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(+n||0),uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7),days=(a,b)=>Math.max(1,Math.ceil((new Date(b)-new Date(a))/86400000));
const CAR_KEY="hotspot_rental_cars",BOOKING_KEY="hotspot_rental_bookings";
let cars=load(CAR_KEY,"drivelux_final_cars",DEFAULT),bookings=load(BOOKING_KEY,"drivelux_final_bookings",[]),filters={category:"",maxPrice:"",sort:"featured",pickup:"",return:""},selected=null;
function intro(){
 const introEl=$("#intro"), video=$("#introVideo"), fallback=$(".intro-fallback");

 if(video){
   video.muted=true;
   video.currentTime=0;
   video.addEventListener("playing",()=>fallback?.classList.add("hidden"),{once:true});
   video.play().catch(()=>{});
 }

 // 0.0s black
 // 0.5s snowy driving film
 // 1.7s title reveal
 // 3.0s fade into the website
 setTimeout(()=>introEl?.classList.add("leave"),3000);
 setTimeout(()=>{
   $("#site").classList.add("ready");
   $("#site").setAttribute("aria-hidden","false");
   document.body.classList.remove("locked");
 },3425);
 setTimeout(()=>introEl?.remove(),3700);
}
function dates(){const a=new Date(),b=new Date(Date.now()+2*86400000),f=d=>d.toISOString().slice(0,10);$("#pickupDate").value=f(a);$("#returnDate").value=f(b);$("#pickupDate").min=f(a);$("#returnDate").min=f(a)}
function categories(){const c=[...new Set(cars.map(x=>x.category))];$("#categoryFilter").innerHTML='<option value="">All vehicles</option>'+c.map(x=>`<option>${esc(x)}</option>`).join("")}
function list(){let x=cars.filter(c=>(!filters.category||c.category===filters.category)&&(!filters.maxPrice||c.price<=+filters.maxPrice));if(filters.sort==="priceAsc")x.sort((a,b)=>a.price-b.price);if(filters.sort==="priceDesc")x.sort((a,b)=>b.price-a.price);if(filters.sort==="name")x.sort((a,b)=>a.name.localeCompare(b.name));return x}
function renderCars(){const x=list();$("#carsGrid").innerHTML=x.map((c,i)=>`<article class="car reveal"><div class="car-img"><img src="${esc(c.image)}" alt="${esc(c.name)}"><span class="index">${String(i+1).padStart(2,"0")}</span>${!c.available?'<span class="unavailable">Unavailable</span>':''}</div><div class="car-body"><div class="car-title"><div><h3>${esc(c.name)}</h3><p>${esc(c.brand)} · ${esc(c.category)} · ${esc(c.color)}</p></div><div class="price"><b>${money(c.price)}</b><small>/ day</small></div></div><div class="specs"><span>${c.seats} seats</span><span>${esc(c.transmission)}</span><span>${esc(c.fuel)}</span><span>${c.available?"Available":"Unavailable"}</span></div><button ${c.available?"":"disabled"} onclick="openBooking('${c.id}')">${c.available?"Reserve vehicle":"Not available"}</button></div></article>`).join("");$("#emptyCars").classList.toggle("hidden",x.length>0);observe()}
function renderBookings(){$("#bookingsEmpty").classList.toggle("hidden",bookings.length>0);$("#bookingsList").innerHTML=bookings.slice().reverse().map(b=>{const c=cars.find(x=>x.id===b.carId)||{name:"Removed car"};return `<article class="booking"><div><span class="status">${esc(b.status)}</span><h3>${esc(c.name)}</h3><div class="booking-meta"><span>${esc(b.pickup)} → ${esc(b.return)}</span><span>${b.days} days</span><span>${esc(b.reference)}</span><span>${esc(b.customerName)}</span></div></div><div class="booking-side"><b>${money(b.total)}</b>${b.status!=="Cancelled"?`<button onclick="cancelBooking('${b.id}')">Cancel</button>`:""}</div></article>`}).join("")}
window.openBooking=id=>{const c=cars.find(x=>x.id===id);if(!c)return;selected=c;const p=filters.pickup||$("#pickupDate").value,r=filters.return||$("#returnDate").value,d=days(p,r);$("#bookingContent").innerHTML=`<span>RESERVE YOUR VEHICLE</span><h2>${esc(c.name)}</h2><p>${esc(c.description)}</p><form id="bookingForm" class="stack"><label>Full name<input id="customerName" required></label><label>Email<input id="customerEmail" type="email" required></label><label>Phone<input id="customerPhone" required></label><label>Pickup<input id="bookingPickup" type="date" value="${p}" required></label><label>Return<input id="bookingReturn" type="date" value="${r}" required></label><button>Confirm · ${money(d*c.price)}</button></form>`;openModal("booking");$("#bookingForm").onsubmit=book}
function book(e){e.preventDefault();const p=$("#bookingPickup").value,r=$("#bookingReturn").value;if(new Date(r)<=new Date(p)){toast("Return date must be after pickup");return}const d=days(p,r);bookings.push({id:uid("b_"),reference:"HS-"+Math.random().toString(36).slice(2,8).toUpperCase(),carId:selected.id,customerName:$("#customerName").value.trim(),customerEmail:$("#customerEmail").value.trim(),customerPhone:$("#customerPhone").value.trim(),pickup:p,return:r,days:d,total:d*selected.price,status:"Confirmed"});save(BOOKING_KEY,bookings);closeModal("booking");renderBookings();toast("Reservation confirmed")}
window.cancelBooking=id=>{const b=bookings.find(x=>x.id===id);if(b&&confirm("Cancel this booking?")){b.status="Cancelled";save(BOOKING_KEY,bookings);renderBookings();toast("Reservation cancelled")}}
function openModal(n){$("#"+n+"Modal").classList.remove("hidden");document.body.style.overflow="hidden"}function closeModal(n){$("#"+n+"Modal").classList.add("hidden");if($$(".modal:not(.hidden)").length===0)document.body.style.overflow=""}
function observe(){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");o.unobserve(e.target)}}),{threshold:.1});$$(".reveal:not(.visible)").forEach(e=>o.observe(e))}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
document.addEventListener("DOMContentLoaded",()=>{
 intro();dates();categories();renderCars();renderBookings();observe();
 $("#searchForm").onsubmit=e=>{
   e.preventDefault();
   filters.pickup=$("#pickupDate").value;
   filters.return=$("#returnDate").value;
   filters.category=$("#categoryFilter").value;
   filters.maxPrice=$("#maxPrice").value;
   renderCars();
   location.hash="#fleet"
 };
 $("#sortCars").onchange=e=>{filters.sort=e.target.value;renderCars()};
 $("#menu").onclick=()=>toggle();
 $$(".mobile-nav a").forEach(a=>a.onclick=()=>toggle(false));
 $$("[data-close]").forEach(x=>x.onclick=()=>closeModal(x.dataset.close))
});
function toggle(force){const n=$("#mobileNav"),open=force===undefined?!n.classList.contains("open"):force;n.classList.toggle("open",open);document.body.style.overflow=open?"hidden":""}
