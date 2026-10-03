const $ = (s) => document.querySelector(s);
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#wa").href = "https://wa.me/" + TEAM.whatsapp;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));

$("#historia-texto").innerHTML = HISTORIA.map((p) => `<p>${p}</p>`).join("");
