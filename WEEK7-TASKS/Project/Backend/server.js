// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();  
const app = express();
app.use(express.json()); 
app.use(cors());  

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Error: ', err));

// User Model
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

// Recipe Model
const Recipe = mongoose.model('Recipe', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true }));

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'Authorization denied. No token.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// Post a Recipe
app.post('/api/recipes', authMiddleware, async (req, res) => {
  const { title, description, ingredients, instructions } = req.body;
  try {
    const recipe = new Recipe({
      title,
      description,
      ingredients,
      instructions,
      creator: req.user.userId,
    });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Error posting recipe' });
  }
});

// Get all Recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('creator', 'username');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes' });
  }
});

// Add a comment to a Recipe
app.post('/api/recipes/:recipeId/comment', authMiddleware, async (req, res) => {
  const { recipeId } = req.params;
  const { comment } = req.body;
  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.comments.push({ user: req.user.userId, comment });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
