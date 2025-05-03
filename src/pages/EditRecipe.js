import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditRecipe = () => {
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
  const [nutritionalInfo, setNutritionalInfo] = useState('');
  const [methodSteps, setMethodSteps] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const navigate = useNavigate();
  const { id } = useParams();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://recipehub-h224.onrender.com';
  const localApiUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        console.log(`Fetching recipe with ID: ${id}`);
        let response = await fetch(`${apiUrl}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok && response.status === 404) {
          console.log(`API fetch failed, trying local: ${localApiUrl}/recipes/${id}`);
          response = await fetch(`${localApiUrl}/recipes/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch recipe');
        }
        const data = await response.json();
        console.log('Fetched recipe:', data);
        console.log('Ingredients units:', data.ingredients.map(ing => ing.unit));
        setName(data.name || '');
        setCuisine(data.cuisine || '');
        setCookingTime(data.cookingTime || '');
        setIngredients(
          data.ingredients && data.ingredients.length > 0
            ? data.ingredients.map(({ name, quantity, unit }) => ({
                name: name || '',
                quantity: quantity || '',
                unit: unit || ''
              }))
            : [{ name: '', quantity: '', unit: '' }]
        );
        setNutritionalInfo(data.nutritionalInfo || '');
        setMethodSteps(data.methodSteps ? data.methodSteps.join(', ') : '');
        setYoutubeLink(data.youtubeLink || '');
        setImageUrl(data.imageUrl || '');
      } catch (err) {
        console.error('Fetch recipe error:', err);
        setError(err.message || 'Error fetching recipe');
      }
    };
    fetchRecipe();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (ingredients.length === 0 || !ingredients.some(ing => ing.name && ing.quantity)) {
      setError('At least one ingredient with name and quantity is required');
      return;
    }

    const formData = new FormData();
    if (name) formData.append('name', name);
    if (cuisine) formData.append('cuisine', cuisine);
    if (cookingTime) formData.append('cookingTime', cookingTime);
    if (ingredients.length) {
      console.log('Submitting ingredients:', ingredients);
      formData.append('ingredients', JSON.stringify(ingredients));
    }
    if (nutritionalInfo) formData.append('nutritionalInfo', nutritionalInfo);
    if (methodSteps) formData.append('methodSteps', JSON.stringify(methodSteps.split(',').map(step => step.trim())));
    if (youtubeLink) formData.append('youtubeLink', youtubeLink);
    if (imageFile) formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      let response = await fetch(`${apiUrl}/recipes/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok && response.status === 404) {
        response = await fetch(`${localApiUrl}/recipes/${id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update recipe');
      }
      navigate('/recipes');
    } catch (err) {
      console.error('Edit recipe error:', err);
      setError(err.message || 'Error updating recipe');
    }
  };

  const handleIngredientChange = (e, index) => {
    const { name, value } = e.target;
    if (index === undefined) {
      setNewIngredient((prev) => ({ ...prev, [name]: value }));
    } else {
      const newIngredients = [...ingredients];
      newIngredients[index][name] = value;
      setIngredients(newIngredients);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity || newIngredient.unit === '') {
      setError('Please fill in all ingredient fields (name, quantity, unit).');
      return;
    }
    const quantityNum = parseFloat(newIngredient.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be a number greater than 0.');
      return;
    }
    setIngredients((prev) => [...prev, { name: newIngredient.name, quantity: newIngredient.quantity, unit: newIngredient.unit }]);
    setNewIngredient({ name: '', quantity: '', unit: '' });
    setError('');
  };

  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="edit-recipe-page">
      <h1>Edit Recipe</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Recipe Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label>Cuisine:</label>
        <input
          type="text"
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          required
        />
        <label>Cooking Time (minutes):</label>
        <input
          type="number"
          value={cookingTime}
          onChange={(e) => setCookingTime(e.target.value)}
          required
        />
        <label>Ingredients:</label>
        <div className="ingredient-inputs">
          <input
            type="text"
            name="name"
            value={newIngredient.name}
            onChange={(e) => handleIngredientChange(e)}
            placeholder="Ingredient name"
          />
          <input
            type="number"
            name="quantity"
            value={newIngredient.quantity}
            onChange={(e) => handleIngredientChange(e)}
            placeholder="Quantity (e.g., 200, 2)"
            min={0.1}
          />
          <select
            name="unit"
            value={newIngredient.unit}
            onChange={(e) => handleIngredientChange(e)}
          >
            <option value="">None</option>
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
          </select>
          <button type="button" onClick={addIngredient}>
            Add Ingredient
          </button>
        </div>
        {ingredients.length > 0 && (
          <ul className="ingredient-list">
            {ingredients.map((ingredient, index) => (
              <li key={index}>
                <input
                  type="text"
                  name="name"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(e, index)}
                  placeholder="Ingredient name"
                />
                <input
                  type="number"
                  name="quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(e, index)}
                  placeholder="Quantity"
                  min={0.1}
                />
                <select
                  name="unit"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(e, index)}
                >
                  <option value="">None</option>
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
                </select>
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
          value={nutritionalInfo}
          onChange={(e) => setNutritionalInfo(e.target.value)}
        />
        <label>Method Steps (comma-separated):</label>
        <input
          type="text"
          value={methodSteps}
          onChange={(e) => setMethodSteps(e.target.value)}
          required
        />
        <label>YouTube Link (optional):</label>
        <input
          type="text"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />
        <label>Image (optional):</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
        />
        {(imageUrl || imagePreview) && (
          <div className="image-preview">
            <img
              src={imagePreview || imageUrl}
              alt="Recipe"
              style={{ maxWidth: '200px' }}
            />
          </div>
        )}
        <button type="submit">Update Recipe</button>
      </form>
    </div>
  );
};

export default EditRecipe;
