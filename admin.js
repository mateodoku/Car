const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[char]));

const money = value =>
  new Intl.NumberFormat("de-DE", {
    style:"currency",
    currency:"EUR"
  }).format(Number(value) || 0);

const uid = () =>
  "c_" + Date.now().toString(36);


let cars = [];
let bookings = [];
let logged = sessionStorage.getItem("hotspot_rental_admin") === "1";
let pendingImage = "";


async function loadCars(){

  const {data,error}=await db
    .from("cars")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error(error);
    return;
  }

  cars=data || [];
}


async function loadBookings(){

  const {data,error}=await db
    .from("bookings")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error(error);
    return;
  }

  bookings=data || [];
}



async function renderAdmin(){

  await loadCars();
  await loadBookings();


  $("#metricCars").textContent=cars.length;

  $("#metricAvailable").textContent =
    cars.filter(car=>car.available).length;

  $("#metricBookings").textContent =
    bookings.length;


  $("#metricRevenue").textContent =
    money(
      bookings
      .filter(b=>b.status!=="Cancelled")
      .reduce((a,b)=>a+Number(b.total||0),0)
    );


  $("#adminCarsTable").innerHTML = cars.length ? `

<table>
<thead>
<tr>
<th>Vehicle</th>
<th>Plate</th>
<th>Category</th>
<th>Price</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

${cars.map(car=>`

<tr>

<td>
<b>${esc(car.name)}</b><br>
${esc(car.brand)}
</td>

<td>${esc(car.plate)}</td>

<td>${esc(car.category)}</td>

<td>${money(car.price)}</td>

<td>${car.available ? "Available":"Unavailable"}</td>

<td>
<button onclick="editCar('${car.id}')">Edit</button>
<button class="danger" onclick="deleteCar('${car.id}')">Delete</button>
</td>

</tr>

`).join("")}

</tbody>
</table>

`:
`<div class="empty">No vehicles yet.</div>`;



$("#adminBookingsTable").innerHTML = bookings.length ? `

<table>

<thead>
<tr>
<th>Reference</th>
<th>Customer</th>
<th>Vehicle</th>
<th>Dates</th>
<th>Total</th>
<th>Status</th>
</tr>
</thead>

<tbody>

${bookings.map(b=>{

const car=cars.find(c=>c.id===b.carId);

return `

<tr>

<td>${esc(b.reference)}</td>

<td>
${esc(b.customerName)}<br>
${esc(b.customerEmail)}
</td>

<td>${esc(car?.name || "Unknown")}</td>

<td>
${esc(b.pickup)}
→
${esc(b.return)}
</td>

<td>${money(b.total)}</td>

<td>${esc(b.status)}</td>

</tr>

`;

}).join("")}

</tbody>

</table>

`:
`<div class="empty">No reservations yet.</div>`;

}



function openModal(){
 $("#editorModal").classList.remove("hidden");
 document.body.style.overflow="hidden";
}


function closeModal(){
 $("#editorModal").classList.add("hidden");
 document.body.style.overflow="";
}



function setPreview(src=""){
 pendingImage=src;
 $("#imagePreview").classList.toggle("hidden",!src);
 $("#imagePreviewImg").src=src;
}



function newCar(){

 $("#editorTitle").textContent="Add vehicle";
 $("#editorForm").reset();
 $("#editCarId").value="";
 $("#carAvailable").checked=true;

 setPreview();

 openModal();

}



window.editCar=function(id){

const car=cars.find(c=>c.id===id);

if(!car)return;


$("#editorTitle").textContent="Edit vehicle";

$("#editCarId").value=car.id;

$("#carName").value=car.name;
$("#carBrand").value=car.brand;
$("#carCategory").value=car.category;
$("#carPrice").value=car.price;
$("#carSeats").value=car.seats;
$("#carTransmission").value=car.transmission;
$("#carFuel").value=car.fuel;
$("#carColor").value=car.color;
$("#carPlate").value=car.plate;
$("#carDescription").value=car.description;
$("#carAvailable").checked=car.available;

setPreview(car.image);

openModal();

}



window.deleteCar=async function(id){

if(!confirm("Delete this vehicle?"))return;


const {error}=await db
.from("cars")
.delete()
.eq("id",id);


if(error){
console.error(error);
toast("Delete failed");
return;
}


await renderAdmin();

toast("Vehicle deleted");

}



function toast(message){

const t=$("#toast");

t.textContent=message;

t.classList.add("show");

setTimeout(()=>t.classList.remove("show"),2000);

}



document.addEventListener("DOMContentLoaded",()=>{


showState();


$("#adminLoginForm").onsubmit=e=>{

e.preventDefault();

if($("#adminPassword").value==="admin123"){

logged=true;

sessionStorage.setItem(
"hotspot_rental_admin",
"1"
);

showState();

}

else{

$("#adminError").textContent="Incorrect password";

}

};



$("#adminLogout").onclick=()=>{

logged=false;

sessionStorage.removeItem(
"hotspot_rental_admin"
);

showState();

};



$("#addCar").onclick=newCar;



$("#editorForm").onsubmit=async e=>{

e.preventDefault();


const id=$("#editCarId").value || uid();


const car={

id,

name:$("#carName").value,

brand:$("#carBrand").value,

category:$("#carCategory").value,

price:Number($("#carPrice").value),

seats:Number($("#carSeats").value),

transmission:$("#carTransmission").value,

fuel:$("#carFuel").value,

color:$("#carColor").value,

plate:$("#carPlate").value,

image:pendingImage,

description:$("#carDescription").value,

available:$("#carAvailable").checked

};



const {error}=await db
.from("cars")
.upsert(car);



if(error){

console.error(error);

toast("Save failed");

return;

}


closeModal();

await renderAdmin();

toast(
$("#editCarId").value
?"Vehicle updated"
:"Vehicle added"
);


};



$$("[data-close]").forEach(el=>{
el.onclick=closeModal;
});


});



async function showState(){

$("#adminLogin")
.classList.toggle("hidden",logged);

$("#adminDashboard")
.classList.toggle("hidden",!logged);


if(logged){

await renderAdmin();

}

}
