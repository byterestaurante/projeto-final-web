const API_URL = "https://projeto-final-web-production.up.railway.app";

const reservaForm = document.getElementById("reservaForm");
const btnSubmit = document.getElementById("btnReserva");
const dataInput = document.getElementById("r_data");

if (dataInput) {
    const hoje = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Belem"
    });

    dataInput.min = hoje;
}

if (reservaForm) {
    reservaForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const dados = {
            nome: document.getElementById("r_nome").value,
            telefone: document.getElementById("r_telefone").value,
            email: document.getElementById("r_email").value,
            data: document.getElementById("r_data").value,
            horario: document.getElementById("r_horario").value,
            pessoas: document.getElementById("r_pessoas").value,
            ocasiao: document.getElementById("r_ocasiao").value,
            observacoes: document.getElementById("r_obs").value
        };

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Enviando";
        btnSubmit.classList.add("btn-loading");

        try {
            const response = await fetch(`${API_URL}/reservas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            const resultado = await response.json();

            mostrarMensagem(
                resultado.sucesso,
                resultado.sucesso
                    ? "Reserva realizada com sucesso!"
                    : resultado.erro || "Erro ao realizar reserva."
            );

            if (resultado.sucesso) {
                reservaForm.reset();
            }

        } catch (error) {
            console.error(error);
            mostrarMensagem(false, "Erro no servidor. Tente novamente.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Reserva 🍽️";
            btnSubmit.classList.remove("btn-loading");
        }
    });
}

function mostrarMensagem(sucesso, texto) {
    const msg = document.getElementById("reservaMsg");
    msg.style.display = "block";
    msg.className = "msg " + (sucesso ? "success" : "error");
    msg.innerHTML = texto;
}

const telefoneInput = document.getElementById("r_telefone");

if (telefoneInput) {
    telefoneInput.addEventListener("input", function () {
        let v = this.value.replace(/\D/g, "").slice(0, 11);

        if (v.length > 6) {
            v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
            v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        }

        this.value = v;
    });
}