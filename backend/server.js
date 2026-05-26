require("dotenv").config();
const rateLimit = require("express-rate-limit");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors({
    origin: "https://byterestaurante.github.io"
}));

app.set("trust proxy", 1);
app.use(express.json());

app.use("/reservas", rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { sucesso: false, erro: "Muitas tentativas. Aguarde 1 minuto e tente novamente." }
}));

app.use("/pedidos", rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { sucesso: false, erro: "Muitas tentativas. Aguarde 1 minuto e tente novamente." }
}));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.post("/reservas", async (req, res) => {
    const { nome, telefone, email, data, horario, pessoas, ocasiao, observacoes } = req.body;

    if (!nome || !telefone || !email || !data || !horario || !pessoas) {
        return res.status(400).json({ sucesso: false, erro: "Preencha todos os campos obrigatórios." });
    }

    if (nome.trim().length < 3) {
        return res.status(400).json({ sucesso: false, erro: "Nome deve ter ao menos 3 caracteres." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ sucesso: false, erro: "O e-mail informado não é válido." });
    }

    const agoraBelem = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Belem" }));
    const dataHoraReserva = new Date(`${data}T${horario}:00`);

    if (isNaN(dataHoraReserva.getTime())) {
        return res.status(400).json({ sucesso: false, erro: "Data ou horário inválido." });
    }

    if (dataHoraReserva - agoraBelem < 30 * 60 * 1000) {
        return res.status(400).json({ sucesso: false, erro: "As reservas devem ser feitas com pelo menos 30 minutos de antecedência." });
    }

    try {
        await db.query(
            `INSERT INTO reservas (nome, telefone, email, data_reserva, horario, pessoas, ocasiao, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome.trim(), telefone.trim(), email.trim(), data, horario, pessoas, ocasiao || null, observacoes?.trim() || null]
        );

        res.json({
            sucesso: true,
            mensagem: "Reserva realizada com sucesso!"
        });

    } catch (err) {
        console.error("Erro ao salvar reserva:", err);
        res.status(500).json({ sucesso: false, erro: "Erro ao salvar reserva." });
    }
});

app.post("/pedidos", async (req, res) => {
    const { nome, telefone, email, endereco, complemento, itens, subtotal, total, pagamento, troco, observacoes } = req.body;

    if (!nome || !telefone || !email || !endereco || !itens || !pagamento) {
        return res.status(400).json({ sucesso: false, erro: "Preencha todos os campos obrigatórios." });
    }

    if (nome.trim().length < 3) {
        return res.status(400).json({ sucesso: false, erro: "Nome deve ter ao menos 3 caracteres." });
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
        return res.status(400).json({ sucesso: false, erro: "Telefone inválido. Use o formato (XX) XXXXX-XXXX." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ sucesso: false, erro: "O e-mail informado não é válido." });
    }

    if (endereco.trim().length < 5) {
        return res.status(400).json({ sucesso: false, erro: "Informe um endereço de entrega válido." });
    }

    const subtotalNum = parseFloat(subtotal);
    if (isNaN(subtotalNum) || subtotalNum < 30) {
        return res.status(400).json({ sucesso: false, erro: "Pedido mínimo é R$ 30,00." });
    }

    if (typeof itens !== "string" || itens.trim().length === 0) {
        return res.status(400).json({ sucesso: false, erro: "Os itens do pedido são inválidos." });
    }

    if (itens.length > 2000) {
        return res.status(400).json({ sucesso: false, erro: "A lista de itens excede o tamanho permitido." });
    }

    if (!/^[\w\sÀ-ú,.\-x×]+$/i.test(itens)) {
        return res.status(400).json({ sucesso: false, erro: "Os itens do pedido contêm caracteres inválidos." });
    }

    if (pagamento === "Dinheiro" && troco) {
        const trocoNum = parseFloat(troco);
        if (!isNaN(trocoNum) && trocoNum < parseFloat(total)) {
            return res.status(400).json({ sucesso: false, erro: "O valor do troco deve ser maior que o total do pedido." });
        }
    }

    try {
        await db.query(
            `INSERT INTO pedidos (nome, telefone, email, endereco, complemento, itens, subtotal, total, pagamento, troco, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                telefone.trim(),
                email.trim(),
                endereco.trim(),
                complemento?.trim() || null,
                itens,
                subtotalNum,
                parseFloat(total),
                pagamento,
                troco ? parseFloat(troco) : null,
                observacoes?.trim() || null
            ]
        );

        res.json({
            sucesso: true,
            mensagem: "Pedido realizado com sucesso! 🛵 Em breve chegará até você."
        });

    } catch (err) {
        console.error("Erro ao salvar pedido:", err);
        res.status(500).json({ sucesso: false, erro: "Erro ao salvar pedido." });
    }
});

const PIX_NOME = process.env.PIX_NOME;
const PIX_CIDADE = process.env.PIX_CIDADE;
const PIX_CHAVE  = process.env.PIX_CHAVE;

function gerarPixPayload(valor) {
    const valorStr = parseFloat(valor).toFixed(2);
    const valorCampo = "54" + String(valorStr.length).padStart(2, "0") + valorStr;

    const chaveSz = String(PIX_CHAVE.length).padStart(2, "0");
    const nomeSz = String(PIX_NOME.length).padStart(2, "0");
    const cidSz = String(PIX_CIDADE.length).padStart(2, "0");

    const merchantInfoConteudo = "0014br.gov.bcb.pix01" + chaveSz + PIX_CHAVE;
    const merchantInfo = "26" + String(merchantInfoConteudo.length).padStart(2, "0") + merchantInfoConteudo;

    const base =
        "000201" +
        "010211" +
        merchantInfo +
        "52040000" +
        "5303986" +
        valorCampo +
        "5802BR" +
        "59" + nomeSz + PIX_NOME +
        "60" + cidSz  + PIX_CIDADE +
        "62070503***" +
        "6304";

    let crc = 0xFFFF;
    for (let i = 0; i < base.length; i++) {
        crc ^= base.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
        crc &= 0xFFFF;
    }

    return base + crc.toString(16).toUpperCase().padStart(4, "0");
}

app.get("/pix/:valor", (req, res) => {
    const valor = parseFloat(req.params.valor);

    if (isNaN(valor) || valor <= 0 || valor > 10000) {
        return res.status(400).json({ sucesso: false, erro: "Valor inválido para geração do PIX." });
    }

    const payload = gerarPixPayload(valor);

    res.json({
        sucesso: true,
        payload,
        chaveExibicao:  "****" + PIX_CHAVE.slice(-4)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});