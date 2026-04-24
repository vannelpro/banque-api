const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const cors= require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let accounts = [];
let currentId = 1;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de transaction bancaire",
      version: "1.0.0",
      description: "API permettant de créer un compte, consulter les comptes, faire des dépôts et des retraits"
    },
    servers: [
      {
        url: "https://banque-api-z65q.onrender.com",
        description: "Serveur Render"
      },
      {
        url: "http://localhost:3000",
        description: "Serveur local"
      }
    ]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("API bancaire opérationnelle. Documentation disponible sur /api-docs");
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Créer un compte bancaire
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - email
 *               - accountType
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Christian
 *               email:
 *                 type: string
 *                 example: christian@gmail.com
 *               accountType:
 *                 type: string
 *                 example: courant
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Champs obligatoires manquants
 */
app.post("/accounts", (req, res) => {
  const { nom, email, accountType } = req.body;

  if (!nom || !email || !accountType) {
    return res.status(400).json({
      message: "Tous les champs sont obligatoires"
    });
  }

  const account = {
    id: currentId++,
    nom,
    email,
    accountType,
    solde: 0
  };

  accounts.push(account);

  res.status(201).json(account);
});

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Afficher la liste des comptes
 *     tags: [Comptes]
 *     responses:
 *       200:
 *         description: Liste des comptes
 */
app.get("/accounts", (req, res) => {
  res.status(200).json(accounts);
});

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Consulter un compte par son identifiant
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du compte
 *     responses:
 *       200:
 *         description: Compte trouvé
 *       404:
 *         description: Compte non trouvé
 */
app.get("/accounts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const account = accounts.find(acc => acc.id === id);

  if (!account) {
    return res.status(404).json({
      message: "Compte non trouvé"
    });
  }

  res.status(200).json(account);
});

/**
 * @swagger
 * /accounts/{id}/deposit:
 *   post:
 *     summary: Faire un dépôt sur un compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du compte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Dépôt effectué avec succès
 *       400:
 *         description: Montant invalide
 *       404:
 *         description: Compte non trouvé
 */
app.post("/accounts/:id/deposit", (req, res) => {
  const id = parseInt(req.params.id);
  const { amount } = req.body;

  const account = accounts.find(acc => acc.id === id);

  if (!account) {
    return res.status(404).json({
      message: "Compte non trouvé"
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      message: "Montant invalide"
    });
  }

  account.solde += amount;

  res.status(200).json({
    message: "Dépôt effectué avec succès",
    account
  });
});

/**
 * @swagger
 * /accounts/{id}/withdraw:
 *   post:
 *     summary: Faire un retrait sur un compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identifiant du compte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200
 *     responses:
 *       200:
 *         description: Retrait effectué avec succès
 *       400:
 *         description: Montant invalide ou solde insuffisant
 *       404:
 *         description: Compte non trouvé
 */
app.post("/accounts/:id/withdraw", (req, res) => {
  const id = parseInt(req.params.id);
  const { amount } = req.body;

  const account = accounts.find(acc => acc.id === id);

  if (!account) {
    return res.status(404).json({
      message: "Compte non trouvé"
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      message: "Montant invalide"
    });
  }

  if (account.solde < amount) {
    return res.status(400).json({
      message: "Solde insuffisant"
    });
  }

  account.solde -= amount;

  res.status(200).json({
    message: "Retrait effectué avec succès",
    account
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});