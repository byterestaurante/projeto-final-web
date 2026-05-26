const API_URL = "https://projeto-final-web-production.up.railway.app";
const TAXA_ENTREGA = 5.00;
const MINIMO_PEDIDO = 30.00;

let sacola = [];

const sacolaVazia = document.getElementById("sacolaVazia");
const sacolaItens = document.getElementById("sacolaItens");
const sacolaResumo = document.getElementById("sacolaResumo");
const sacolaForm = document.getElementById("sacolaForm");
const sacolaBadge = document.getElementById("sacolaBadge");
const sacolaSubtotal = document.getElementById("sacolaSubtotal");
const sacolaTotal = document.getElementById("sacolaTotal");
const deliveryMsg = document.getElementById("deliveryMsg");
const btnFinalizar = document.getElementById("btnFinalizar");

const filtroBtns = document.querySelectorAll(".filtro-btn");
const dlSections = document.querySelectorAll(".dl-section");

filtroBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        filtroBtns.forEach(b => b.classList.remove("active"));
        this.classList.add("active");

        const cat = this.dataset.categoria;

        dlSections.forEach(sec => {
            sec.style.display =
                (cat === "todos" || sec.dataset.cat === cat) ? "block" : "none";
        });
    });
});

document.querySelectorAll(".dl-add-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        const card = this.closest(".dl-card");
        const nome = card.dataset.nome;
        const preco = parseFloat(card.dataset.preco);

        adicionarItem(nome, preco);
        animarBotao(this);
    });
});

function adicionarItem(nome, preco) {
    const existente = sacola.find(i => i.nome === nome);

    if (existente) {
        existente.qtd++;
    } else {
        sacola.push({ nome, preco, qtd: 1 });
    }

    renderizarSacola();
}

function removerItem(nome) {
    const idx = sacola.findIndex(i => i.nome === nome);

    if (idx === -1) return;

    if (sacola[idx].qtd > 1) {
        sacola[idx].qtd--;
    } else {
        sacola.splice(idx, 1);
    }

    renderizarSacola();
}

function renderizarSacola() {
    const totalItens = sacola.reduce((s, i) => s + i.qtd, 0);
    const subtotal = sacola.reduce((s, i) => s + i.preco * i.qtd, 0);
    const total = subtotal + TAXA_ENTREGA;

    sacolaBadge.textContent = totalItens;
    sacolaBadge.style.display = totalItens > 0 ? "inline-flex" : "none";

    if (sacola.length === 0) {
        sacolaVazia.style.display = "flex";
        sacolaItens.style.display = "none";
        sacolaResumo.style.display = "none";
        sacolaForm.style.display = "none";
        deliveryMsg.style.display = "none";
        return;
    }

    sacolaVazia.style.display = "none";
    sacolaItens.style.display = "block";
    sacolaResumo.style.display = "block";
    sacolaForm.style.display = "block";

    sacolaItens.innerHTML = sacola.map(item => `
        <li class="sacola-item">
            <div class="sacola-item-info">
                <span class="sacola-item-nome">${item.nome}</span>
                <span class="sacola-item-preco">R$ ${(item.preco * item.qtd).toFixed(2).replace(".", ",")}</span>
            </div>
            <div class="sacola-item-controles">
                <button class="sacola-ctrl minus" data-nome="${item.nome}" aria-label="Remover um ${item.nome}">−</button>
                <span class="sacola-item-qtd">${item.qtd}</span>
                <button class="sacola-ctrl plus" data-nome="${item.nome}" aria-label="Adicionar mais ${item.nome}">+</button>
            </div>
        </li>
    `).join("");

    sacolaItens.querySelectorAll(".sacola-ctrl.minus").forEach(b => {
        b.addEventListener("click", () => removerItem(b.dataset.nome));
    });

    sacolaItens.querySelectorAll(".sacola-ctrl.plus").forEach(b => {
        b.addEventListener("click", () => adicionarItem(
            b.dataset.nome,
            sacola.find(i => i.nome === b.dataset.nome).preco
        ));
    });

    sacolaSubtotal.textContent = "R$ " + subtotal.toFixed(2).replace(".", ",");
    sacolaTotal.textContent = "R$ " + total.toFixed(2).replace(".", ",");
}

const telefoneInput = document.getElementById("d_telefone");

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

let dadosPedidoPendente = null;

if (sacolaForm) {
    sacolaForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const subtotal = sacola.reduce((s, i) => s + i.preco * i.qtd, 0);

        if (sacola.length === 0) {
            mostrarMensagem(false, "Adicione ao menos um item à sacola.");
            return;
        }

        if (subtotal < MINIMO_PEDIDO) {
            mostrarMensagem(
                false,
                `Pedido mínimo é R$ ${MINIMO_PEDIDO.toFixed(2).replace(".", ",")}. Faltam R$ ${(MINIMO_PEDIDO - subtotal).toFixed(2).replace(".", ",")}.`
            );
            return;
        }

        const nome = document.getElementById("d_nome").value.trim();
        const telefone = document.getElementById("d_telefone").value.trim();
        const email = document.getElementById("d_email").value.trim();
        const endereco = document.getElementById("d_endereco").value.trim();

        if (nome.length < 3) {
            mostrarMensagem(false, "Nome deve ter ao menos 3 caracteres.");
            return;
        }

        const telLimpo = telefone.replace(/\D/g, "");

        if (telLimpo.length < 10 || telLimpo.length > 11) {
            mostrarMensagem(false, "Telefone inválido. Use o formato (XX) XXXXX-XXXX.");
            return;
        }

        if (!email) {
            mostrarMensagem(false, "O e-mail é obrigatório.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarMensagem(false, "O e-mail informado não é válido.");
            return;
        }

        if (endereco.length < 5) {
            mostrarMensagem(false, "Informe um endereço de entrega válido.");
            return;
        }

        const itensPedido = sacola.map(i => `${i.qtd}x ${i.nome}`).join(", ");
        const complemento = document.getElementById("d_complemento").value;
        const observacoes = document.getElementById("d_obs").value;

        dadosPedidoPendente = {
            nome,
            telefone,
            email,
            endereco,
            complemento,
            itens: itensPedido,
            subtotal: subtotal.toFixed(2),
            total: (subtotal + TAXA_ENTREGA).toFixed(2),
            pagamento: "Pix",
            troco: "",
            observacoes
        };

        abrirModalRevisao(dadosPedidoPendente, subtotal);
    });
}

function abrirModalRevisao(dados, subtotal) {
    const overlay = document.getElementById("revisaoModalOverlay");

    const listaEl = document.getElementById("revisaoItens");

    listaEl.innerHTML = sacola.map(item => `
        <li class="revisao-item">
            <span class="revisao-item-nome">
                <span class="revisao-item-qtd">${item.qtd}</span>
                ${item.nome}
            </span>
            <span class="revisao-item-preco">R$ ${(item.preco * item.qtd).toFixed(2).replace(".", ",")}</span>
        </li>
    `).join("");

    document.getElementById("revisaoSubtotal").textContent =
        "R$ " + subtotal.toFixed(2).replace(".", ",");

    document.getElementById("revisaoTotal").textContent =
        "R$ " + (subtotal + TAXA_ENTREGA).toFixed(2).replace(".", ",");

    document.getElementById("revisaoNome").textContent = dados.nome;
    document.getElementById("revisaoTelefone").textContent = dados.telefone;
    document.getElementById("revisaoEmail").textContent = dados.email;
    document.getElementById("revisaoEndereco").textContent = dados.endereco;

    const compWrap = document.getElementById("revisaoComplementoWrap");

    if (dados.complemento && dados.complemento.trim()) {
        document.getElementById("revisaoComplemento").textContent = dados.complemento;
        compWrap.style.display = "block";
    } else {
        compWrap.style.display = "none";
    }

    const obsWrap = document.getElementById("revisaoObsWrap");

    if (dados.observacoes && dados.observacoes.trim()) {
        document.getElementById("revisaoObs").textContent = dados.observacoes;
        obsWrap.style.display = "block";
    } else {
        obsWrap.style.display = "none";
    }

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    document.getElementById("btnRevisaoEditar").onclick = function () {
        fecharModalRevisao();
    };

    document.getElementById("btnRevisaoPagar").onclick = async function () {
        const btn = this;

        btn.disabled = true;
        btn.textContent = "Enviando...";

        try {
            const response = await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosPedidoPendente)
            });

            const resultado = await response.json();

            if (!resultado.sucesso) {
                fecharModalRevisao();

                mostrarMensagem(
                    false,
                    resultado.erro || "Erro ao registrar o pedido. Tente novamente."
                );

                btn.disabled = false;
                btn.textContent = "💳 Prosseguir para Pagamento";
                return;
            }
        } catch (err) {
            console.error(err);
            fecharModalRevisao();
            mostrarMensagem(false, "Erro de conexão com o servidor. Verifique sua internet e tente novamente.");
            btn.disabled = false;
            btn.textContent = "💳 Prosseguir para Pagamento";
            return;
        }

        const totalValor = parseFloat(dadosPedidoPendente.total);

        fecharModalRevisao();
        await abrirModalPix(totalValor);

        btn.disabled = false;
        btn.textContent = "💳 Prosseguir para Pagamento";
    };

    document.getElementById("revisaoModalClose").onclick = fecharModalRevisao;

    const clickFora = function (e) {
        if (e.target === overlay) {
            fecharModalRevisao();
            overlay.removeEventListener("click", clickFora);
        }
    };

    overlay.addEventListener("click", clickFora);
}

function fecharModalRevisao() {
    const overlay = document.getElementById("revisaoModalOverlay");

    overlay.style.display = "none";
    document.body.style.overflow = "";
}

async function abrirModalPix(total) {
    const overlay = document.getElementById("pixModalOverlay");
    const totalValor = document.getElementById("pixTotalValor");
    const chaveValor = document.getElementById("pixChaveValor");
    const qrContainer = document.getElementById("pixQrCode");

    totalValor.textContent = "R$ " + total.toFixed(2).replace(".", ",");
    chaveValor.textContent = "Carregando...";
    qrContainer.innerHTML = "<p style='color:#888;font-size:0.9rem;'>Gerando QR Code...</p>";

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    try {
        const resp = await fetch(`${API_URL}/pix/${total.toFixed(2)}`);
        const dados = await resp.json();

        if (!dados.sucesso) {
            qrContainer.innerHTML  = "<p style='color:#c0392b;font-size:0.9rem;'>Não foi possível gerar o QR Code. Use a chave PIX para pagar.</p>";
            chaveValor.textContent = "Indisponível";
        } else {
            chaveValor.textContent = dados.chaveExibicao;

            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dados.payload)}`;
            qrContainer.innerHTML  = `<img src="${qrUrl}" alt="QR Code PIX" width="200" height="200" />`;

            const btnCopiar = document.getElementById("btnCopiarPix");
            btnCopiar.onclick = function () {
                navigator.clipboard.writeText(dados.payload).then(() => {
                    btnCopiar.textContent = "✅ Copiado!";
                    setTimeout(() => { btnCopiar.innerHTML = "<span>📋</span> Copiar código"; }, 2000);
                }).catch(() => {
                    btnCopiar.textContent = "✅ Copiado!";
                    setTimeout(() => { btnCopiar.innerHTML = "<span>📋</span> Copiar código"; }, 2000);
                });
            };
        }
    } catch (err) {
        console.error("Erro ao buscar PIX:", err);
        qrContainer.innerHTML  = "<p style='color:#c0392b;font-size:0.9rem;'>Não foi possível gerar o QR Code. Use a chave PIX para pagar.</p>";
        chaveValor.textContent = "Indisponível";
    }

    document.getElementById("pixModalClose").onclick = fecharModalPix;

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) fecharModalPix();
    });

    sacola = [];
    renderizarSacola();
    sacolaForm.reset();
}

function fecharModalPix() {
    const overlay = document.getElementById("pixModalOverlay");

    overlay.style.display = "none";
    document.body.style.overflow = "";
}

function animarBotao(btn) {
    btn.classList.add("dl-add-btn--animado");

    setTimeout(() => {
        btn.classList.remove("dl-add-btn--animado");
    }, 300);
}

function mostrarMensagem(sucesso, texto) {
    deliveryMsg.style.display = "block";
    deliveryMsg.className = "msg " + (sucesso ? "success" : "error");
    deliveryMsg.textContent = texto;

    deliveryMsg.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

renderizarSacola();