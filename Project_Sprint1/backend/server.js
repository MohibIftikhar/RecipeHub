const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v4: uuidv4 } = require('uuid');

// Version: 2025-05-08 - Added methodSteps validation and detailed logging for POST /recipes
dotenv.config();

const app = express();

// Validate environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`Error: Missing required environment variable: ${env}`);
    process.exit(1);
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  unit: { type: String, default: '', required: true }
});

const commentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const recipeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  cookingTime: { type: Number, required: true },
  ingredients: [ingredientSchema],
  nutritionalInfo: { type: String, default: '' },
  methodSteps: { type: [String], required: true },
  youtubeLink: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  comments: [commentSchema],
  rating: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  reviews: [{ type: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);
const Counter = mongoose.model('Counter', counterSchema);

// Middleware
app.use(cors({
  origin: ['https://recipehubfe.onrender.com', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Multer setup with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipehub',
    allowed_formats: ['jpg', 'png'],
    public_id: (req, file) => `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(file.originalname.toLowerCase().split('.').pop());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg and .png files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

const getNextRecipeId = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'recipeId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    console.log('Counter updated:', counter); // Debug log
    return counter.seq;
  } catch (err) {
    console.error('getNextRecipeId error:', err);
    throw err;
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to RecipeHub!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ message: 'Login successful', token, username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

app.get('/recipes', verifyToken, async (req, res) => {
  try {
    const recipes = await Recipe.find();
    console.log('Fetched recipes:', recipes);
    res.json(recipes);
  } catch (err) {
    console.error('Fetch recipes error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/recipes/:id', verifyToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      console.log(`Invalid recipe ID received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    console.log(`Fetching recipe with ID: ${recipeId} (type: ${typeof recipeId})`);
    const recipe = await Recipe.findOne({ id: recipeId });
    console.log('Recipe found:', recipe ? recipe : 'None');
    if (!recipe) {
      return res.status(404).json({ message: `Recipe with ID ${recipeId} not found` });
    }
    res.json(recipe);
  } catch (err) {
    console.error('Fetch recipe error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/recipes', verifyToken, upload.single('image'), handleMulterError, async (req, res) => {
  const { name, cuisine, cookingTime, ingredients, nutritionalInfo, methodSteps, youtubeLink } = req.body;
  if (!name || !cuisine || !cookingTime || !ingredients || !methodSteps) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  try {
    const parsedCookingTime = parseInt(cookingTime);
    if (isNaN(parsedCookingTime) || parsedCookingTime <= 0) {
      return res.status(400).json({ message: 'Cooking time must be a positive number' });
    }
    console.log('Received ingredients:', ingredients);
    let parsedIngredients;
    try {
      parsedIngredients = JSON.parse(ingredients);
      console.log('Parsed ingredients:', parsedIngredients);
    } catch (parseError) {
      console.error('Ingredients parse error:', parseError);
      return res.status(400).json({ message: 'Invalid ingredients format' });
    }
    if (!Array.isArray(parsedIngredients)) {
      return res.status(400).json({ message: 'Ingredients must be an array' });
    }
    let parsedMethodSteps;
    try {
      parsedMethodSteps = JSON.parse(methodSteps);
      console.log('Parsed methodSteps:', parsedMethodSteps);
      if (!Array.isArray(parsedMethodSteps)) {
        return res.status(400).json({ message: 'methodSteps must be an array' });
      }
      parsedMethodSteps = parsedMethodSteps.map(step => typeof step === 'string' ? step.trim() : '');
      if (parsedMethodSteps.length === 0 || parsedMethodSteps.every(step => !step)) {
        return res.status(400).json({ message: 'methodSteps cannot be empty' });
      }
    } catch (parseError) {
      console.error('Method steps parse error:', parseError);
      return res.status(400).json({ message: 'Invalid methodSteps format' });
    }
    const recipeId = await getNextRecipeId();
    console.log('Assigned recipe ID:', recipeId);
    const newRecipe = new Recipe({
      id: recipeId,
      name,
      cuisine,
      cookingTime: parsedCookingTime,
      ingredients: parsedIngredients.map(({ name, quantity, unit }) => ({
        name: name || '',
        quantity: quantity || '',
        unit: unit || ''
      })),
      nutritionalInfo: nutritionalInfo || '',
      methodSteps: parsedMethodSteps,
      youtubeLink: youtubeLink || '',
      imageUrl: req.file ? req.file.path : '',
      comments: [],
      rating: 0,
      createdBy: req.user.username,
      reviews: []
    });
    console.log('Saving recipe:', newRecipe);
    await newRecipe.save();
    console.log('Recipe added:', newRecipe);
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error('Add recipe error:', err);
    res.status(500).json({ message: 'Server error during recipe creation', error: err.message });
  }
});

app.put('/recipes/:id', verifyToken, upload.single('image'), handleMulterError, async (req, res) => {
  const { name, cuisine, cookingTime, ingredients, nutritionalInfo, methodSteps, youtubeLink } = req.body;
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      console.log(`Invalid recipe ID received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    const recipe = await Recipe.findOne({ id: recipeId });
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (req.user.username !== recipe.createdBy) {
      return res.status(403).json({ message: 'You are not authorized to edit this recipe' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (cuisine) updateData.cuisine = cuisine;
    if (cookingTime) {
      const parsedCookingTime = parseInt(cookingTime);
      if (isNaN(parsedCookingTime) || parsedCookingTime <= 0) {
        return res.status(400).json({ message: 'Cooking time must be a positive number' });
      }
      updateData.cookingTime = parsedCookingTime;
    }
    if (ingredients) {
      const parsedIngredients = JSON.parse(ingredients);
      console.log('Parsed ingredients:', parsedIngredients);
      if (!Array.isArray(parsedIngredients)) {
        return res.status(400).json({ message: 'Ingredients must be an array' });
      }
      updateData.ingredients = parsedIngredients.map(({ name, quantity, unit }) => ({
        name: name || '',
        quantity: quantity || '',
        unit: unit || ''
      }));
    }
    if (nutritionalInfo) updateData.nutritionalInfo = nutritionalInfo;
    if (methodSteps) {
      let parsedMethodSteps;
      try {
        parsedMethodSteps = JSON.parse(methodSteps);
        if (!Array.isArray(parsedMethodSteps)) {
          return res.status(400).json({ message: 'methodSteps must be an array' });
        }
        parsedMethodSteps = parsedMethodSteps.map(step => typeof step === 'string' ? step.trim() : '');
        if (parsedMethodSteps.length === 0 || parsedMethodSteps.every(step => !step)) {
          return res.status(400).json({ message: 'methodSteps cannot be empty' });
        }
        updateData.methodSteps = parsedMethodSteps;
      } catch (parseError) {
        console.error('Method steps parse error:', parseError);
        return res.status(400).json({ message: 'Invalid methodSteps format' });
      }
    }
    if (youtubeLink) updateData.youtubeLink = youtubeLink;
    if (req.file) {
      if (recipe.imageUrl) {
        const publicId = recipe.imageUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      }
      updateData.imageUrl = req.file.path;
      console.log('Updated imageUrl:', updateData.imageUrl);
    }

    const updatedRecipe = await Recipe.findOneAndUpdate(
      { id: recipeId },
      { $set: updateData },
      { new: true }
    );
    if (!updatedRecipe) return res.status(404).json({ message: 'Recipe not found' });

    console.log('Recipe updated:', updatedRecipe);
    res.json(updatedRecipe);
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ message: 'Server error during recipe update', error: err.message });
  }
});

app.delete('/recipes/:id', verifyToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      console.log(`Invalid recipe ID received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    console.log(`Deleting recipe with ID: ${recipeId}`);
    const recipe = await Recipe.findOne({ id: recipeId });
    console.log('Recipe found:', recipe ? recipe : 'None');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (req.user.username !== 'maryam865' && req.user.username !== recipe.createdBy) {
      return res.status(403).json({ message: 'You are not authorized to delete this recipe' });
    }

    if (recipe.imageUrl) {
      const publicId = recipe.imageUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image from Cloudinary: ${publicId}`);
    }

    await Recipe.deleteOne({ id: recipeId });
    console.log('Recipe deleted:', recipeId);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ message: 'Server error during recipe deletion', error: err.message });
  }
});

app.post('/recipes/:id/comment', verifyToken, async (req, res) => {
  const { comment, rating } = req.body;
  try {
    if (!comment || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Comment and rating (1-5) are required' });
    }
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      console.log(`Invalid recipe ID received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    const recipe = await Recipe.findOne({ id: recipeId });
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.comments.push({ comment, rating: parseInt(rating), user: req.user.id });
    const totalRating = recipe.comments.reduce((sum, c) => sum + c.rating, 0);
    recipe.rating = (totalRating / recipe.comments.length).toFixed(1);

    await recipe.save();
    console.log('Comment added to recipe:', recipeId);
    res.json({ message: 'Comment added', recipe });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error during comment addition', error: err.message });
  }
});

app.delete('/recipes/:id/comments/:commentIndex', verifyToken, async (req, res) => {
  try {
    if (req.user.username !== 'maryam865') {
      return res.status(403).json({ message: 'Only admin can delete comments' });
    }

    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      console.log(`Invalid recipe ID received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }
    const recipe = await Recipe.findOne({ id: recipeId });
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const commentIndex = parseInt(req.params.commentIndex);
    if (isNaN(commentIndex) || commentIndex < 0 || commentIndex >= recipe.comments.length) {
      return res.status(400).json({ message: 'Invalid comment index' });
    }

    recipe.comments.splice(commentIndex, 1);

    if (recipe.comments.length > 0) {
      const totalRating = recipe.comments.reduce((sum, c) => sum + c.rating, 0);
      recipe.rating = (totalRating / recipe.comments.length).toFixed(1);
    } else {
      recipe.rating = 0;
    }

    await recipe.save();
    console.log('Comment deleted from recipe:', recipeId);
    res.json({ message: 'Comment deleted successfully', recipe });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Server error during comment deletion', error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
