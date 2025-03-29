const navEl = document.querySelector(".navbar");
const searchBar = document.querySelector(".form-control");

// Temporarily disable the scroll event listener
// window.addEventListener("scroll", () => {
//   if (window.scrollY >= 56) {
//     navEl.classList.add("navbar-scrolled");
//     searchBar.classList.add("navbar-scrolled");
//   }
// });

fetch("navbar.html")
  .then((response) => response.text())
  .then((data) => {
    console.log("Navbar loaded");
    document.getElementById("navbar-placeholder").innerHTML = data;
  })
  .catch((error) => {
    console.error("Error loading navbar:", error);
  });

fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-placeholder").innerHTML = data;
  })
  .catch((error) => {
    console.error("Error loading footer:", error);
  });

fetch("aziende.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("aziende-placeholder").innerHTML = data;
  })
  .catch((error) => {
    console.error("Error loading footer:", error);
  });