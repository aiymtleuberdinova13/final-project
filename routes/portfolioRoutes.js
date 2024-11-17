const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Middleware для проверки авторизации

router.get('/create', authMiddleware.isAuthenticated, portfolioController.showCreateForm);

router.post('/create', authMiddleware.isAuthenticated, portfolioController.createPortfolioItem);

router.get('/edit/:id', authMiddleware.isAuthenticated, portfolioController.showEditForm);

router.post('/edit/:id', authMiddleware.isAuthenticated, portfolioController.editPortfolioItem);

router.get('/delete/:id', authMiddleware.isAuthenticated, portfolioController.deletePortfolioItem);

module.exports = router;
