import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddRecipe = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    cookingTime: '',
    ingredients: [],
    nutritionalInfo: '',
    methodSteps: '',
    youtubeLink: '',
    image: null,
  });
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [cookingTimeError, setCookingTimeError] = useState('');
  const [error, setError] = useState('');
  const [ingredientError, setIngredientError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'cookingTime') {
      setCookingTimeError('');
    }
    if (name === 'youtubeLink') {
      setYoutubeError('');
    }
    setError('');
  };

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient((prev) => ({ ...prev, [name]: value }));
    setIngredientError('');
  };

  const addIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity || newIngredient.unit === '') {
      setIngredientError('Please fill in all ingredient fields (name, quantity, unit).');
      return;
    }
    const quantityNum = parseFloat(newIngredient.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setIngredientError('Quantity must be a number greater than 0.');
      return;
    }
    const unit = newIngredient.unit === 'null' ? null : newIngredient.unit;
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: newIngredient.name, quantity: newIngredient.quantity, unit }],
    }));
    setNewIngredient({ name: '', quantity: '', unit: '' });
    setIngredientError('');
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const validateYouTubeLink = (link) => {
    if (!link) return true; // Link is optional, so empty is valid
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(&.*)?$/;
    return youtubeRegex.test(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCookingTimeError('');
    setError('');
    setYoutubeError('');

    const cookingTime = parseInt(formData.cookingTime);
    if (isNaN(cookingTime) || cookingTime <= 0) {
      setCookingTimeError('Cooking time must be greater than 0 minutes');
      return;
    }

    if (formData.ingredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    if (!validateYouTubeLink(formData.youtubeLink)) {
      setYoutubeError('Please enter a valid YouTube link (e.g., https://www.youtube.com/watch?v=VIDEO_ID)');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (key === 'image' && formData.image) {
        data.append('image', formData.image);
      } else if (key === 'ingredients') {
        data.append('ingredients', JSON.stringify(formData.ingredients));
      } else {
        data.append(key, formData[key]);
      }
    }

    try {
      await axios.post('http://localhost:5000/recipes', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/recipes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add recipe');
    }
  };

  return (
    <div className="add-recipe-page">
      <h1>Add a New Recipe</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Recipe Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <label>Cuisine:</label>
        <input
          type="text"
          name="cuisine"
          value={formData.cuisine}
          onChange={handleChange}
          required
        />
        <label>Cooking Time (minutes):</label>
        <input
          type="number"
          name="cookingTime"
          value={formData.cookingTime}
          onChange={handleChange}
          required
        />
        {cookingTimeError && <p style={{ color: 'red' }}>{cookingTimeError}</p>}
        <label>Ingredients:</label>
        <div className="ingredient-inputs">
          <input
            type="text"
            name="name"
            value={newIngredient.name}
            onChange={handleIngredientChange}
            placeholder="Ingredient name"
          />
          <input
            type="number"
            name="quantity"
            value={newIngredient.quantity}
            onChange={handleIngredientChange}
            placeholder="Quantity (e.g., 200, 2)"
            min={0.1}
          />
          <select
            name="unit"
            value={newIngredient.unit}
            onChange={handleIngredientChange}
          >
            <option value="">Select unit</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
            <option value="ounce">ounce</option>
            <option value="cup">cup</option>
            <option value="tsp">tsp</option>
            <option value="tbsp">tbsp</option>
            <option value="pinch">pinch</option>
            <option value="clove">clove</option>
            <option value="inch">inch</option>
            <option value="small">small</option>
            <option value="medium">medium</option>
            <option value="null">None</option>
          </select>
          <button type="button" onClick={addIngredient}>
            Add Ingredient
          </button>
        </div>
        {ingredientError && <p className="ingredient-error">{ingredientError}</p>}
        {formData.ingredients.length > 0 && (
          <ul className="ingredient-list">
            {formData.ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.name}: {ingredient.quantity} {ingredient.unit !== null ? ingredient.unit : ''}
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="remove-ingredient"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <label>Nutritional Info (optional):</label>
        <input
          type="text"
          name="nutritionalInfo"
          value={formData.nutritionalInfo}
          onChange={handleChange}
        />
        <label>Method Steps (comma-separated):</label>
        <input
          type="text"
          name="methodSteps"
          value={formData.methodSteps}
          onChange={handleChange}
          required
        />
        <label>YouTube Link (optional):</label>
        <input
          type="text"
          name="youtubeLink"
          value={formData.youtubeLink}
          onChange={handleChange}
        />
        {youtubeError && <p className="youtube-error">{youtubeError}</p>}
        <label>Image (optional):</label>
        <input
          type="file"
          name="image"
          onChange={handleImageChange}
          accept="image/jpeg,image/png"
        />
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px' }} />
          </div>
        )}
        <button type="submit">Add Recipe</button>
      </form>
    </div>
  );
};

export default AddRecipe;