const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", toggleMenu);
}

function toggleMenu() {
    navLinks.classList.toggle("open");
}