// Required dependencies
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('./config')
const Task = require("./models/taskModel")
const User = require("./models/userModel")

// Create an Express application
const app = express();

// Middleware to parse JSON body
app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'secret_key');
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, 'secret_key', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Create a new task
app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.userData.userId;

    const task = new Task({ name, description, user: userId });
    await task.save();

    res.status(201).json({ message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Get all tasks for the authenticated user
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const userId = req.userData.userId;

    const tasks = await Task.find({ user: userId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
});

// Update a task
app.put('/api/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const userId = req.userData.userId;
    const taskId = req.params.taskId;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { name, description, status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task
app.delete('/api/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const userId = req.userData.userId;
    const taskId = req.params.taskId;

    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

/////////////BONUS FEATURE IMPLEMENTATION///////////////////////
// Get all tasks for the authenticated user with filtering
app.get('/api/tasks/search', authenticate, async (req, res) => {
    try {
      const userId = req.userData.userId;
      const { status } = req.query; // Retrieve the 'status' query parameter "http://localhost:3000/api/tasks/search?status=pending"
  
      let query = { user: userId };
      
      if (status) {
        query.status = status; // Filter tasks by status if 'status' query parameter is provided
      }
  
      const tasks = await Task.find(query);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving tasks' });
    }
  });

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
