const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const money = (v) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(v || 0));

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

const uid = () => "c_" + Date.now();

let cars = [];
let bookings = [];
let logged = sessionStorage.getItem("hotspot_rental_admin") === "1";
let pendingImage = "";


// ==========================
// SUPABASE LOADERS
// ==========================

async function loadCars() {

  const { data, error } = await db
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Cars error:", error);
    toast("Could not load cars");
    return;
  }

  cars = data || [];
}



async function loadBookings() {

  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });


  if (error) {
    console.error("Bookings error:", error);
    toast("Could not load bookings");
    return;
  }


  bookings = data || [];

}



// ==========================
// DASHBOARD
// ==========================

async function renderAdmin() {

  await loadCars();
  await loadBookings();


  $("#metricCars").textContent = cars.length;

  $("#metricAvailable").textContent =
    cars.filter(c => c.available).length;

  $("#metricBookings").textContent =
    bookings.length;


  $("#metricRevenue").textContent =
    money(
      bookings
        .filter(b => b.status !== "Cancelled")
        .reduce((sum,b)=>sum + Number(b.total || 0),0)
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

<td>
${car.available ? "Available":"Unavailable"}
</td>

<td>
<button onclick="editCar('${car.id}')">
Edit
</button>

<button class="danger" onclick="deleteCar('${car.id}')">
Delete
</button>
</td>

</tr>

`).join("")}

</tbody>
</table>

` :
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

const car = cars.find(c=>c.id === b.carId);


return `

<tr>

<td>${esc(b.reference)}</td>

<td>
${esc(b.customerName)}<br>
${esc(b.customerEmail)}
</td>


<td>
${esc(car?.name || "Unknown")}
</td>


<td>
${esc(b.pickup)}
 →
${esc(b.return)}
</td>


<td>
${money(b.total)}
</td>


<td>
${esc(b.status)}
</td>


</tr>

`;

}).join("")}


</tbody>

</table>

`
:
`<div class="empty">No reservations yet.</div>`;

}



// ==========================
// MODAL
// ==========================


function openEditor(){

 $("#editorModal").classList.remove("hidden");

 document.body.style.overflow="hidden";

}


function closeEditor(){

 $("#editorModal").classList.add("hidden");

 document.body.style.overflow="";

}



function setPreview(src=""){

 pendingImage = src;

 $("#imagePreview")
 .classList.toggle("hidden", !src);

 $("#imagePreviewImg").src = src || "";

}



// ==========================
// CAR ACTIONS
// ==========================


function newCar(){

 $("#editorTitle").textContent="Add vehicle";

 $("#editorForm").reset();

 $("#editCarId").value="";

 $("#carAvailable").checked=true;

 setPreview();

 openEditor();

}



window.editCar = function(id){

const car = cars.find(c=>c.id===id);

if(!car)return;


$("#editorTitle").textContent="Edit vehicle";

$("#editCarId").value=car.id;

$("#carName").value=car.name || "";
$("#carBrand").value=car.brand || "";
$("#carCategory").value=car.category || "";
$("#carPrice").value=car.price || "";
$("#carSeats").value=car.seats || "";
$("#carTransmission").value=car.transmission || "";
$("#carFuel").value=car.fuel || "";
$("#carColor").value=car.color || "";
$("#carPlate").value=car.plate || "";
$("#carDescription").value=car.description || "";
$("#carAvailable").checked=car.available;


setPreview(car.image);


openEditor();

};




window.deleteCar = async function(id){

if(!confirm("Delete this vehicle?")) return;


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

};



// ==========================
// SAVE CAR
// ==========================


$("#editorForm").onsubmit = async function(e){

e.preventDefault();


const id =
$("#editCarId").value || uid();



const car = {

id,

name: $("#carName").value.trim(),

brand: $("#carBrand").value.trim(),

category: $("#carCategory").value.trim(),

price:Number($("#carPrice").value),

seats:Number($("#carSeats").value),

transmission:$("#carTransmission").value,

fuel:$("#carFuel").value,

color:$("#carColor").value.trim(),

plate:$("#carPlate").value.trim(),

image:pendingImage,

description:$("#carDescription").value.trim(),

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


closeEditor();

await renderAdmin();


toast("Vehicle saved");


};




// ==========================
// LOGIN
// ==========================


async function showState(){

$("#adminLogin")
.classList.toggle("hidden",logged);


$("#adminDashboard")
.classList.toggle("hidden",!logged);



if(logged){

await renderAdmin();

}

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



$("#clearImage").onclick=()=>{

$("#carImageFile").value="";

setPreview();

};



$("#carImageFile").onchange=e=>{

const file=e.target.files[0];

if(!file)return;


const reader=new FileReader();


reader.onload=()=>setPreview(reader.result);


reader.readAsDataURL(file);


};



$$("[data-close]").forEach(btn=>{

btn.onclick=closeEditor;

});



$$("[data-tab]").forEach(btn=>{

btn.onclick=()=>{


$$("[data-tab]")
.forEach(x=>x.classList.remove("active"));


btn.classList.add("active");


$("#adminCarsTab")
.classList.toggle("hidden",btn.dataset.tab!=="cars");


$("#adminBookingsTab")
.classList.toggle("hidden",btn.dataset.tab!=="bookings");


};

});


});



function toast(msg){

const t=$("#toast");

t.textContent=msg;

t.classList.add("show");


setTimeout(()=>{

t.classList.remove("show");

},2200);

}
