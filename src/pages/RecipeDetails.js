import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('5');
  const [servings, setServings] = useState(1);
  const [servingsError, setServingsError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get(`https://recipehub-h224.onrender.com/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecipe(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Recipe not found or an error occurred');
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCommentError('');

    if (!comment.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    if (comment.length > 255) {
      setCommentError('Comment must be 255 characters or less.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.post(
        `https://recipehub-h224.onrender.com/recipes/${id}/comment`,
        { comment, rating: parseInt(rating) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecipe(res.data.recipe);
      setComment('');
      setRating('5');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment');
    }
  };

  const handleServingsChange = (e) => {
    const value = e.target.value;
    setServings(value);
    setServingsError('');

    const numServings = parseInt(value);
    if (isNaN(numServings) || numServings <= 0) {
      setServingsError('Servings must be a number greater than 0.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!recipe) return <h2>Recipe not found!</h2>;

  const scaledIngredients = recipe.ingredients.map((ingredient) => {
    const quantityNum = parseFloat(ingredient.quantity);
    const scaledQuantity = quantityNum * servings;
    return {
      ...ingredient,
      scaledQuantity: isNaN(scaledQuantity) ? ingredient.quantity : scaledQuantity.toString(),
    };
  });

  return (
    <div className="recipe-details">
      {recipe.imageUrl && (
        <div className="recipe-image">
          <img
            src={`https://recipehub-h224.onrender.com${recipe.imageUrl}`}
            alt={recipe.name}
          />
        </div>
      )}
      <h1>{recipe.name}</h1>
      <p><strong>Cuisine:</strong> {recipe.cuisine}</p>
      <p><strong>Cooking Time:</strong> {recipe.cookingTime} minutes</p>
      <p><strong>Adjust Servings:</strong></p>
      <div className="servings-input">
        <input
          type="number"
          value={servings}
          onChange={handleServingsChange}
          min="1"
          placeholder="Number of servings"
        />
      </div>
      {servingsError && <p className="servings-error">{servingsError}</p>}
      <p><strong>Ingredients (for 1 serving):</strong></p>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={index}>
            {ingredient.name}: {ingredient.quantity} {ingredient.unit !== null ? ingredient.unit : ''}
          </li>
        ))}
      </ul>
      {servings !== 1 && !servingsError && (
        <>
          <p><strong>Adjusted Ingredients (for {servings} serving{servings > 1 ? 's' : ''}):</strong></p>
          <ul className="scaled-ingredients">
            {scaledIngredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.name}: {ingredient.scaledQuantity} {ingredient.unit !== null ? ingredient.unit : ''}
              </li>
            ))}
          </ul>
        </>
      )}
      <p><strong>Nutritional Info:</strong> {recipe.nutritionalInfo}</p>
      <p><strong>Method Steps:</strong></p>
      <ol>
        {recipe.methodSteps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <p><strong>YouTube Tutorial:</strong> <a href={recipe.youtubeLink} target="_blank" rel="noopener noreferrer">Watch Video</a></p>

      <div className="recipe-actions">
        <Link to={`/edit-recipe/${recipe._id}`} className="edit-link">
          ✏️ Edit
        </Link>
        <button onClick={handlePrint} className="print-button">
          🖨️ Print Recipe
        </button>
      </div>

      <h3>Comments:</h3>
      {recipe.comments?.length > 0 ? (
        <ul>
          {recipe.comments.map((c, index) => (
            <li key={index} className="review-item">{c.comment} ⭐ {c.rating}/5</li>
          ))}
        </ul>
      ) : (
        <p>No comments yet.</p>
      )}

      <h3>Add a Comment</h3>
      <form onSubmit={handleCommentSubmit}>
        <label>Write your comment:</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setCommentError('');
          }}
          placeholder="Enter your comment"
          required
        />
        {commentError && <p className="comment-error">{commentError}</p>}
        <label>Rating (1-5):</label>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="1">⭐</option>
          <option value="2">⭐⭐</option>
          <option value="3">⭐⭐⭐</option>
          <option value="4">⭐⭐⭐⭐</option>
          <option value="5">⭐⭐⭐⭐⭐</option>
        </select>
        <button type="submit">Submit Comment</button>
      </form>
    </div>
  );
}

export default RecipeDetails;
