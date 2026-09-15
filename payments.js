"use strict";

/*
 * Goldpay — Paiements
 * Connexion réelle à :
 * /functions/v1/merchant-payments
 */

const SUPABASE_URL =
    "https://autcbkafczthxcyjkobf.supabase.co";

const API_URL =
    `${SUPABASE_URL}/functions/v1/merchant-payments`;

const PAGE_SIZE = 20;

let currentPage = 1;

const paymentsContainer =
    document.getElementById("paymentsContainer");

const pagination =
    document.getElementById("pagination");

const pageInfo =
    document.getElementById("pageInfo");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const countryFilter =
    document.getElementById("countryFilter");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


/* --------------------------------
   RÉCUPÉRATION DU TOKEN gp_
-------------------------------- */

function getSessionToken() {

    const possibleKeys = [
        "goldpay_session",
        "goldpay_token",
        "gp_session",
        "gp_token",
        "session_token",
        "merchant_session_token"
    ];

    for (const key of possibleKeys) {

        const value = localStorage.getItem(key);

        if (value && value.startsWith("gp_")) {
            return value;
        }

        if (value) {

            try {

                const parsed = JSON.parse(value);

                const candidates = [
                    parsed?.token,
                    parsed?.session_token,
                    parsed?.access_token
                ];

                for (const candidate of candidates) {

                    if (
                        typeof candidate === "string" &&
                        candidate.startsWith("gp_")
                    ) {
                        return candidate;
                    }
                }

            } catch (_) {}
        }
    }


    /* Recherche de sécurité dans tout localStorage */

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (!key) continue;

        const value = localStorage.getItem(key);

        if (
            value &&
            typeof value === "string" &&
            value.startsWith("gp_")
        ) {
            return value;
        }

        try {

            const parsed = JSON.parse(value);

            const candidates = [
                parsed?.token,
                parsed?.session_token,
                parsed?.access_token
            ];

            for (const candidate of candidates) {

                if (
                    typeof candidate === "string" &&
                    candidate.startsWith("gp_")
                ) {
                    return candidate;
                }
            }

        } catch (_) {}
    }

    return null;
}


/* --------------------------------
   REDIRECTION LOGIN
-------------------------------- */

function redirectToLogin() {

    window.location.href = "login.html";
}


/* --------------------------------
   FORMAT XOF
-------------------------------- */

function formatXOF(value) {

    const number = Number(value || 0);

    return `${number.toLocaleString("fr-FR")} XOF`;
}


/* --------------------------------
   DATE
-------------------------------- */

function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* --------------------------------
   STATUT
-------------------------------- */

function statusLabel(status) {

    const labels = {
        pending: "En attente",
        confirmed: "Confirmé",
        failed: "Échoué",
        cancelled: "Annulé",
        reversed: "Inversé"
    };

    return labels[status] || status || "Inconnu";
}


/* --------------------------------
   PAYS
-------------------------------- */

function countryLabel(code) {

    const countries = {
        BF: "Burkina Faso",
        BJ: "Benin",
        CI: "Côte d'Ivoire",
        TG: "Togo"
    };

    return countries[code] || code || "—";
}


/* --------------------------------
   ÉCHAPPEMENT HTML
-------------------------------- */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* --------------------------------
   AFFICHAGE D'UN PAIEMENT
-------------------------------- */

function renderPayment(payment) {

    const status =
        String(payment.status || "pending").toLowerCase();

    const linkName =
        payment.payment_link_name || "Paiement direct";

    const provider =
        payment.provider || "—";

    const payer =
        payment.payer_number || "—";

    const reference =
        payment.westpay_reference ||
        payment.westpay_tx_id ||
        "—";

    return `
        <article class="payment">

            <div class="payment-top">

                <div>
                    <div class="amount">
                        ${formatXOF(payment.amount)}
                    </div>

                    <div class="date">
                        ${formatDate(payment.created_at)}
                    </div>
                </div>

                <span class="status ${escapeHTML(status)}">
                    ${escapeHTML(statusLabel(status))}
                </span>

            </div>

            <div class="details">

                <div>
                    <div class="detail-label">
                        Pays
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(countryLabel(payment.country_code))}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Frais Goldpay
                    </div>
                    <div class="detail-value">
                        ${formatXOF(payment.fee_amount)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Net marchand
                    </div>
                    <div class="detail-value">
                        ${formatXOF(payment.net_amount)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Opérateur
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(provider)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Numéro payeur
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(payer)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Lien
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(linkName)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Référence WestPay
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(reference)}
                    </div>
                </div>

                <div>
                    <div class="detail-label">
                        Devise
                    </div>
                    <div class="detail-value">
                        ${escapeHTML(payment.currency || "XOF")}
                    </div>
                </div>

            </div>

        </article>
    `;
}


/* --------------------------------
   CHARGEMENT
-------------------------------- */

async function loadPayments() {

    const token = getSessionToken();

    if (!token) {

        redirectToLogin();
        return;
    }

    paymentsContainer.innerHTML = `
        <div class="loading">
            Chargement des paiements...
        </div>
    `;

    pagination.style.display = "none";


    const country =
        countryFilter.value.trim();

    const status =
        statusFilter.value.trim();


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({

                page: currentPage,

                limit: PAGE_SIZE,

                country_code:
                    country || undefined,

                status:
                    status || undefined

            })

        });


        let data = null;

        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }


        if (response.status === 401) {

            /*
             * Session expirée ou invalide.
             * On nettoie uniquement les anciennes clés connues.
             */

            const keys = [
                "goldpay_session",
                "goldpay_token",
                "gp_session",
                "gp_token",
                "session_token",
                "merchant_session_token"
            ];

            keys.forEach(key => {
                localStorage.removeItem(key);
            });

            redirectToLogin();
            return;
        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Impossible de charger les paiements."
            );
        }


        const payments =
            Array.isArray(data?.payments)
                ? data.payments
                : [];


        const paginationData =
            data?.pagination || {};


        if (payments.length === 0) {

            paymentsContainer.innerHTML = `
                <div class="empty">
                    Aucun paiement trouvé.
                </div>
            `;

        } else {

            paymentsContainer.innerHTML =
                `<div class="payments">
                    ${payments.map(renderPayment).join("")}
                </div>`;
        }


        updatePagination(paginationData);

    } catch (error) {

        console.error("Goldpay payments:", error);

        paymentsContainer.innerHTML = `
            <div class="error">

                <div>
                    ${escapeHTML(
                        error.message ||
                        "Une erreur est survenue."
                    )}
                </div>

                <button
                    class="retry"
                    id="retryBtn"
                >
                    Réessayer
                </button>

            </div>
        `;

        document
            .getElementById("retryBtn")
            ?.addEventListener("click", loadPayments);
    }
}


/* --------------------------------
   PAGINATION
-------------------------------- */

function updatePagination(data) {

    const page =
        Number(data.page || currentPage);

    const pages =
        Number(data.pages || 1);

    const total =
        Number(data.total || 0);

    currentPage = page;


    if (total <= PAGE_SIZE && pages <= 1) {

        pagination.style.display = "none";
        return;
    }


    pagination.style.display = "flex";

    pageInfo.textContent =
        `Page ${page} / ${pages} — ${total} paiement${total > 1 ? "s" : ""}`;


    prevBtn.disabled =
        page <= 1;

    nextBtn.disabled =
        page >= pages;
}


/* --------------------------------
   FILTRES
-------------------------------- */

countryFilter.addEventListener(
    "change",
    () => {

        currentPage = 1;

        loadPayments();
    }
);


statusFilter.addEventListener(
    "change",
    () => {

        currentPage = 1;

        loadPayments();
    }
);


/* --------------------------------
   PAGINATION BOUTONS
-------------------------------- */

prevBtn.addEventListener(
    "click",
    () => {

        if (currentPage <= 1) {
            return;
        }

        currentPage--;

        loadPayments();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


nextBtn.addEventListener(
    "click",
    () => {

        currentPage++;

        loadPayments();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* --------------------------------
   ACTUALISER
-------------------------------- */

refreshBtn.addEventListener(
    "click",
    () => {

        loadPayments();
    }
);


/* --------------------------------
   DÉCONNEXION
-------------------------------- */

logoutBtn.addEventListener(
    "click",
    () => {

        const keys = [
            "goldpay_session",
            "goldpay_token",
            "gp_session",
            "gp_token",
            "session_token",
            "merchant_session_token"
        ];

        keys.forEach(key => {
            localStorage.removeItem(key);
        });

        redirectToLogin();
    }
);


/* --------------------------------
   DÉMARRAGE
-------------------------------- */

loadPayments();
