const filtroBtns = document.querySelectorAll(".filtro-btn");
const menuSections = document.querySelectorAll(".menu-section");

if (filtroBtns.length > 0) {
    filtroBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            filtroBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            const categoria = this.dataset.categoria;

            menuSections.forEach(sec => {
                if (categoria === "todos" || sec.dataset.cat === categoria) {
                    sec.style.display = "block";
                } else {
                    sec.style.display = "none";
                }
            });
        });
    });
}
