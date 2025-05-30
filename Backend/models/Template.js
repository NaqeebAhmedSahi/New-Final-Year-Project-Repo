import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  htmlFileName: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  cssFileName: {
    type: String,
  },
  cssContent: {
    type: String,
  },
});

const websiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['ecommerce', 'blog', 'portfolio'],
    required: true,
    default: 'ecommerce'
  },
  content: {
    type: Map,
    of: contentSchema,
    default: {},
  },
});

const Website = mongoose.model('Website', websiteSchema);
export default Website;