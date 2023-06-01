const mongoose = require("mongoose");

// Define the Task schema
const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });
  
  module.exports = mongoose.model('Task', taskSchema);
  