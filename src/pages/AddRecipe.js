import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddRecipe = () => {
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
  const [imagePreview, setImagePreview] = useState(null);
  const [cookingTimeError, setCookingTimeError] = useState('');
  const [ingredientError, setIngredientError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://recipehub-h224.onrender.com';
  const localApiUrl = 'http://localhost:5000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'cookingTime') {
      const time = parseInt(value);
      if (isNaN(time) || time <= 0) {
        setCookingTimeError('Cooking time must be a number greater than 0');
      } else {
        setCookingTimeError('');
      }
    }

    if (name === 'youtubeLink' && value) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(value)) {
        setYoutubeError('Please enter a valid YouTube URL');
      } else {
        setYoutubeError('');
      }
    } else if (name === 'youtubeLink') {
      setYoutubeError('');
    }
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

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient((prev) => ({ ...prev, [name]: value }));
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
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: newIngredient.name, quantity: newIngredient.quantity, unit: newIngredient.unit }],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCookingTimeError('');
    setIngredientError('');
    setYoutubeError('');

    if (!formData.name || !formData.cuisine || !formData.cookingTime || !formData.methodSteps) {
      setIngredientError('Please fill in all required fields.');
      return;
    }

    if (formData.cookingTime <= 0) {
      setCookingTimeError('Cooking time must be a number greater than 0');
      return;
    }

    if (formData.ingredients.length === 0) {
      setIngredientError('At least one ingredient is required');
      return;
    }

    const methodStepsArray = formData.methodSteps.split(',').map(step => step.trim()).filter(step => step);
    if (methodStepsArray.length === 0) {
      setIngredientError('At least one method step is required.');
      return;
    }

    if (formData.youtubeLink) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(formData.youtubeLink)) {
        setYoutubeError('Please enter a valid YouTube URL');
        return;
      }
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('cuisine', formData.cuisine);
    submitData.append('cookingTime', formData.cookingTime);
    console.log('Submitting ingredients:', formData.ingredients);
    console.log('Submitting methodSteps:', formData.methodSteps); // Debug log
    submitData.append('ingredients', JSON.stringify(formData.ingredients));
    submitData.append('methodSteps', JSON.stringify(methodStepsArray));
    submitData.append('nutritionalInfo', formData.nutritionalInfo);
    submitData.append('youtubeLink', formData.youtubeLink);
    if (formData.image) {
      submitData.append('image', formData.image);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      let response = await fetch(`${apiUrl}/recipes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (!response.ok && response.status === 404) {
        response = await fetch(`${localApiUrl}/recipes`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        });
      }

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add recipe');
      }

      navigate('/recipes');
    } catch (err) {
      console.error('Add recipe error:', err);
      setIngredientError(err.message || 'Error adding recipe');
    }
  };

  return (
    <div className="add-recipe-page">
      <h1>Add Recipe</h1>
      {(cookingTimeError || ingredientError || youtubeError) && (
        <p style={{ color: 'red' }}>
          {cookingTimeError || ingredientError || youtubeError}
        </p>
      )}
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
            min="0"
            step="0.1"
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
            <option value="large">large</option>
            <option value="  ">None</option>
          </select>
          <button type="button" onClick={addIngredient}>
            Add Ingredient
          </button>
        </div>
        {formData.ingredients.length > 0 && (
          <ul className="ingredient-list">
            {formData.ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.name}: {ingredient.quantity} {ingredient.unit}
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
        <label>Image (optional):</label>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
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
