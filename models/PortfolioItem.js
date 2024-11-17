const mongoose = require('mongoose');

const PortfolioItem = mongoose.models.PortfolioItem || mongoose.model('PortfolioItem', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

module.exports = PortfolioItem;
