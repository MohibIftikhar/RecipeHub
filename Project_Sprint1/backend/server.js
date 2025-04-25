// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const User = require('./models/User');
const Recipe = require('./models/Recipe');

dotenv.config();

const app = express();
const port = 5000;

// Connect to MongoDB
console.log("Attempting to connect to MongoDB...");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connection established successfully.');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Optionally log the error stack for more details
  console.error(err.stack);
});

// Additional logging during the startup process
mongoose.connection.on('connecting', () => {
  console.log('MongoDB is connecting...');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established.');
});

mongoose.connection.on('disconnecting', () => {
  console.log('MongoDB is disconnecting...');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Secret
const SECRET_KEY = process.env.JWT_SECRET || 'h@jsoeeiwq';

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg and .png files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to RecipeHub!');
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get all recipes
app.get('/recipes', verifyToken, async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    console.error('Error getting recipes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a recipe by ID
app.get('/recipes/:id', verifyToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    res.json(recipe);
  } catch (err) {
    console.error('Error getting recipe:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new recipe
app.post('/recipes', verifyToken, upload.single('image'), async (req, res) => {
  const { name, cuisine, cookingTime, ingredients, nutritionalInfo, methodSteps, youtubeLink } = req.body;
  try {
    let parsedIngredients = JSON.parse(ingredients);

    const newRecipe = new Recipe({
      name,
      cuisine,
      cookingTime: parseInt(cookingTime),
      ingredients: parsedIngredients,
      nutritionalInfo: nutritionalInfo || '',
      methodSteps: typeof methodSteps === 'string' ? methodSteps.split(',').map(item => item.trim()) : methodSteps,
      youtubeLink: youtubeLink || '',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      comments: [],
      rating: 0
    });

    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ message: 'Server error during recipe creation' });
  }
});

// Update a recipe
app.put('/recipes/:id', verifyToken, upload.single('image'), async (req, res) => {
  const { name, cuisine, cookingTime, ingredients, nutritionalInfo, methodSteps, youtubeLink } = req.body;
  try {
    const updateData = {};

    if (name) updateData.name = name;
    if (cuisine) updateData.cuisine = cuisine;
    if (cookingTime) updateData.cookingTime = parseInt(cookingTime);
    if (ingredients) updateData.ingredients = JSON.parse(ingredients);
    if (nutritionalInfo) updateData.nutritionalInfo = nutritionalInfo;
    if (methodSteps) {
      updateData.methodSteps = typeof methodSteps === 'string'
        ? methodSteps.split(',').map(item => item.trim())
        : methodSteps;
    }
    if (youtubeLink) updateData.youtubeLink = youtubeLink;
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedRecipe) return res.status(404).json({ message: 'Recipe not found' });

    res.json(updatedRecipe);
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ message: 'Server error during recipe update' });
  }
});

// Delete a recipe
app.delete('/recipes/:id', verifyToken, async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) return res.status(404).json({ message: 'Recipe not found' });

    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ message: 'Server error during recipe deletion' });
  }
});

// Add a comment to a recipe
app.post('/recipes/:id/comment', verifyToken, async (req, res) => {
  const { comment, rating } = req.body;
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.comments.push({ comment, rating: parseInt(rating) });
    const totalRating = recipe.comments.reduce((sum, c) => sum + c.rating, 0);
    recipe.rating = (totalRating / recipe.comments.length).toFixed(1);

    await recipe.save();
    res.json({ message: 'Comment added', recipe });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error during comment addition' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
