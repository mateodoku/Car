const DEFAULT = [
  { id: "c1", name: "Porsche 911 GT3 RS", brand: "Porsche", category: "Performance", price: 349, seats: 2, transmission: "Automatic", fuel: "Petrol", color: "Black", plate: "HS 001 HR", available: true, image: "assets/porsche-snow.png", description: "A road-focused icon engineered for precision, emotion, and unforgettable alpine routes." },
  { id: "c2", name: "Mercedes-AMG GT 63", brand: "Mercedes-AMG", category: "Grand Touring", price: 289, seats: 4, transmission: "Automatic", fuel: "Hybrid", color: "Obsidian", plate: "HS 063 HR", available: true, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1400&q=88", description: "A luxurious grand tourer with serious performance and effortless comfort." },
  { id: "c3", name: "BMW M4 Competition", brand: "BMW M", category: "Performance", price: 239, seats: 4, transmission: "Automatic", fuel: "Petrol", color: "Green", plate: "HS 004 HR", available: true, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=88", description: "A performance coupé balancing daily usability with sharp response." },
  { id: "c4", name: "Audi RS e-tron GT", brand: "Audi Sport", category: "Electric", price: 259, seats: 5, transmission: "Automatic", fuel: "Electric", color: "Grey", plate: "HS 007 HR", available: true, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=88", description: "Electric grand touring with immediate acceleration and understated presence." }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const KEY = "hotspot_rental_cars";
const LEGACY_KEY = "drivelux_final_cars";
const BOOKING_KEY = "hotspot_rental_bookings";
const LEGACY_BOOKING_KEY = "drivelux_final_bookings";
const load = (key, legacyKey, fallback) => { try { return JSON.parse(localStorage.getItem(key) || localStorage.getItem(legacyKey)) || fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const money = value => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const uid = prefix => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
let cars = load(KEY, LEGACY_KEY, DEFAULT);
let bookings = load(BOOKING_KEY, LEGACY_BOOKING_KEY, []);
const plateRefresh = { "HS 911 GT": "HS 001 HR", "HS 063 AMG": "HS 063 HR", "HS 004 M4": "HS 004 HR", "HS 001 EGT": "HS 007 HR" };
cars = cars.map(car => plateRefresh[car.plate] ? { ...car, plate: plateRefresh[car.plate] } : car);
save(KEY, cars);
let logged = sessionStorage.getItem("hotspot_rental_admin") === "1";
let pendingImage = "";

function showState() {
  $("#adminLogin").classList.toggle("hidden", logged);
  $("#adminDashboard").classList.toggle("hidden", !logged);
  if (logged) renderAdmin();
}

function renderAdmin() {
  $("#metricCars").textContent = cars.length;
  $("#metricAvailable").textContent = cars.filter(car => car.available).length;
  $("#metricBookings").textContent = bookings.length;
  $("#metricRevenue").textContent = money(bookings.filter(booking => booking.status !== "Cancelled").reduce((sum, booking) => sum + Number(booking.total || 0), 0));
  $("#adminCarsTable").innerHTML = cars.length ? `<table><thead><tr><th>Vehicle</th><th>License plate</th><th>Category</th><th>Price / day</th><th>Status</th><th>Actions</th></tr></thead><tbody>${cars.map(car => `<tr><td><b>${esc(car.name)}</b><br>${esc(car.brand)}</td><td>${esc(car.plate || "Not set")}</td><td>${esc(car.category)}</td><td>${money(car.price)}</td><td>${car.available ? "Available" : "Unavailable"}</td><td><div class="table-actions"><button onclick="editCar('${car.id}')">Edit</button><button class="danger" onclick="deleteCar('${car.id}')">Delete</button></div></td></tr>`).join("")}</tbody></table>` : '<div class="empty">No vehicles yet. Add your first vehicle above.</div>';
  $("#adminBookingsTable").innerHTML = bookings.length ? `<table><thead><tr><th>Reference</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead><tbody>${bookings.map(booking => { const car = cars.find(item => item.id === booking.carId); return `<tr><td>${esc(booking.reference)}</td><td>${esc(booking.customerName)}</td><td>${esc(car?.name || "Removed")}</td><td>${esc(booking.pickup)} → ${esc(booking.return)}</td><td>${money(booking.total)}</td><td>${esc(booking.status)}</td></tr>`; }).join("")}</tbody></table>` : '<div class="empty">No reservations yet.</div>';
}

function openModal(name) { $(`#${name}Modal`).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModal(name) { $(`#${name}Modal`).classList.add("hidden"); document.body.style.overflow = ""; }
function setPreview(src = "") { pendingImage = src; $("#imagePreview").classList.toggle("hidden", !src); $("#imagePreviewImg").src = src || ""; }
function newCar() { $("#editorTitle").textContent = "Add vehicle"; $("#editorForm").reset(); $("#editCarId").value = ""; $("#carAvailable").checked = true; setPreview(); openModal("editor"); }

window.editCar = id => {
  const car = cars.find(item => item.id === id);
  if (!car) return;
  $("#editorTitle").textContent = "Edit vehicle";
  $("#editCarId").value = car.id;
  $("#carName").value = car.name;
  $("#carBrand").value = car.brand;
  $("#carCategory").value = car.category;
  $("#carPrice").value = car.price;
  $("#carSeats").value = car.seats;
  $("#carTransmission").value = car.transmission;
  $("#carFuel").value = car.fuel;
  $("#carColor").value = car.color;
  $("#carPlate").value = car.plate || "";
  $("#carDescription").value = car.description;
  $("#carAvailable").checked = car.available;
  $("#carImageFile").value = "";
  setPreview(car.image);
  openModal("editor");
};

window.deleteCar = id => {
  if (!confirm("Delete this vehicle? Existing reservations will stay in the booking history.")) return;
  cars = cars.filter(car => car.id !== id);
  save(KEY, cars);
  renderAdmin();
  toast("Vehicle deleted");
};

function toast(message) { const element = $("#toast"); element.textContent = message; element.classList.add("show"); setTimeout(() => element.classList.remove("show"), 2200); }

document.addEventListener("DOMContentLoaded", () => {
  showState();
  $("#adminLoginForm").onsubmit = event => { event.preventDefault(); if ($("#adminPassword").value === "admin123") { logged = true; sessionStorage.setItem("hotspot_rental_admin", "1"); $("#adminError").textContent = ""; showState(); } else $("#adminError").textContent = "Incorrect password"; };
  $("#adminLogout").onclick = () => { logged = false; sessionStorage.removeItem("hotspot_rental_admin"); showState(); };
  $("#addCar").onclick = newCar;
  $("#carImageFile").onchange = event => { const file = event.target.files[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { event.target.value = ""; toast("Please choose an image under 2 MB"); return; } const reader = new FileReader(); reader.onload = () => setPreview(reader.result); reader.readAsDataURL(file); };
  $("#clearImage").onclick = () => { $("#carImageFile").value = ""; setPreview(); };
  $("#editorForm").onsubmit = event => {
    event.preventDefault();
    const id = $("#editCarId").value;
    const existing = cars.find(car => car.id === id);
    const image = pendingImage || existing?.image || "assets/porsche-snow.png";
    const data = { id: id || uid("c_"), name: $("#carName").value.trim(), brand: $("#carBrand").value.trim(), category: $("#carCategory").value.trim(), price: Number($("#carPrice").value), seats: Number($("#carSeats").value), transmission: $("#carTransmission").value, fuel: $("#carFuel").value, color: $("#carColor").value.trim(), plate: $("#carPlate").value.trim().toUpperCase(), image, description: $("#carDescription").value.trim(), available: $("#carAvailable").checked };
    cars = id ? cars.map(car => car.id === id ? data : car) : [...cars, data];
    try { save(KEY, cars); closeModal("editor"); renderAdmin(); toast(id ? "Vehicle updated" : "Vehicle added"); } catch { toast("Image is too large for browser storage. Choose a smaller photo."); }
  };
  $$('[data-close]').forEach(element => element.onclick = () => closeModal(element.dataset.close));
  $$('[data-tab]').forEach(button => button.onclick = () => { $$('[data-tab]').forEach(item => item.classList.remove("active")); button.classList.add("active"); $("#adminCarsTab").classList.toggle("hidden", button.dataset.tab !== "cars"); $("#adminBookingsTab").classList.toggle("hidden", button.dataset.tab !== "bookings"); });
});
