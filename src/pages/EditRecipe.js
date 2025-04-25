import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditRecipe = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    cookingTime: '',
    ingredients: [],
    nutritionalInfo: '',
    methodSteps: '',
    youtubeLink: '',
    image: null
  });
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [error, setError] = useState('');
  const [ingredientError, setIngredientError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`https://recipehub-h224.onrender.com/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Fetched recipe data:");
        setFormData({
          name: res.data.name,
          cuisine: res.data.cuisine,
          cookingTime: res.data.cookingTime,
          ingredients: res.data.ingredients,
          nutritionalInfo: res.data.nutritionalInfo,
          methodSteps: res.data.methodSteps.join(', '),
          youtubeLink: res.data.youtubeLink,
          image: null
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch recipe');
      }
    };
    fetchRecipe();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (formData.ingredients.length === 0) {
        setError('At least one ingredient is required');
        return;
      }
      const data = new FormData();
      data.append('name', formData.name);
      data.append('cuisine', formData.cuisine);
      data.append('cookingTime', formData.cookingTime);
      data.append('ingredients', JSON.stringify(formData.ingredients));
      data.append('nutritionalInfo', formData.nutritionalInfo);
      data.append('methodSteps', formData.methodSteps);
      data.append('youtubeLink', formData.youtubeLink);
      if (formData.image) {
        data.append('image', formData.image);
      }
      await axios.put(`https://recipehub-h224.onrender.com/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/recipes');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update recipe');
    }
  };

  return (
    <div className="edit-recipe-page">
      <h1>Edit Recipe</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Name:</label>
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
        <label>Nutritional Info:</label>
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
        <label>YouTube Link:</label>
        <input
          type="text"
          name="youtubeLink"
          value={formData.youtubeLink}
          onChange={handleChange}
        />
        <label>Image:</label>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
        />
        <button type="submit">Update Recipe</button>
      </form>
    </div>
  );
};

export default EditRecipe;
