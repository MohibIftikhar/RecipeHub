import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('5');
  const [servings, setServings] = useState(1);
  const [servingsError, setServingsError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'https://recipehub-h224.onrender.com';
  const storedUsername = localStorage.getItem('username') || '';
  console.log('RecipeDetails - Stored username:', storedUsername); // Debug log
  const isAdmin = storedUsername === 'maryam865';
  console.log('RecipeDetails - isAdmin:', isAdmin); // Debug log

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        console.log(`Fetching recipe with ID: ${id}`); // Debug log
        const res = await axios.get(`${apiUrl}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('RecipeDetails - Fetched recipe:', res.data); // Debug log
        setRecipe(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch recipe error:', err.response || err.message || err); // Debug log
        if (err.response?.status === 404) {
          setError('Recipe not found');
        } else if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Error fetching recipe');
        }
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, navigate]);

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
      if (!token) {
        navigate('/login');
        return;
      }
      console.log('Submitting comment:', { comment, rating }); // Debug log
      const res = await axios.post(
        `${apiUrl}/recipes/${id}/comment`,
        { comment, rating: parseInt(rating) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Comment submit response:', res.data); // Debug log
      setRecipe(res.data.recipe);
      setComment('');
      setRating('5');
    } catch (err) {
      console.error('Comment submit error:', err.response || err.message || err); // Debug log
      setError(err.response?.data?.message || 'Failed to submit comment');
    }
  };

  const handleDeleteComment = async (commentIndex) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      console.log(`Deleting comment at index: ${commentIndex}`); // Debug log
      const res = await axios.delete(
        `${apiUrl}/recipes/${id}/comments/${commentIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Delete comment response:', res.data); // Debug log
      setRecipe(res.data.recipe);
    } catch (err) {
      console.error('Delete comment error:', err.response || err.message || err); // Debug log
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDeleteRecipe = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        console.log(`Deleting recipe with ID: ${id}`); // Debug log
        await axios.delete(`${apiUrl}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Recipe deleted successfully'); // Debug log
        navigate('/recipes');
      } catch (err) {
        console.error('Delete recipe error:', err.response || err.message || err); // Debug log
        setError(err.response?.data?.message || 'Failed to delete recipe');
      }
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

  const canEditRecipe = storedUsername === recipe.createdBy; // Creator can edit
  const canDeleteRecipe = isAdmin || storedUsername === recipe.createdBy; // Admin or creator can delete
  console.log('RecipeDetails - Permissions:', { // Debug log
    canEditRecipe,
    canDeleteRecipe,
    isAdmin,
    storedUsername,
    createdBy: recipe.createdBy,
  });

  return (
    <div className="recipe-details">
      {recipe.imageUrl && (
        <div className="recipe-image">
          <img
            src={recipe.imageUrl.startsWith('https://res.cloudinary.com') ? recipe.imageUrl : `${apiUrl}${recipe.imageUrl}`}
            alt={recipe.name}
            onError={(e) => {
              e.target.src = '/fallback-image.jpg';
              console.error(`Failed to load image: ${recipe.imageUrl}`);
            }}
          />
        </div>
      )}
      <h1>{recipe.name}</h1>
      <p><strong>Created By:</strong> {recipe.createdBy || 'Unknown'}</p>
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
            {ingredient.name}: {ingredient.quantity} {ingredient.unit || ''}
          </li>
        ))}
      </ul>
      {servings !== 1 && !servingsError && (
        <>
          <p><strong>Adjusted Ingredients (for {servings} serving{servings > 1 ? 's' : ''}):</strong></p>
          <ul className="scaled-ingredients">
            {scaledIngredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.name}: {ingredient.scaledQuantity} {ingredient.unit || ''}
              </li>
            ))}
          </ul>
        </>
      )}
      <p><strong>Nutritional Info:</strong> {recipe.nutritionalInfo || 'N/A'}</p>
      <p><strong>Method Steps:</strong></p>
      <ol>
        {recipe.methodSteps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      {recipe.youtubeLink && (
        <p><strong>YouTube Tutorial:</strong> <a href={recipe.youtubeLink} target="_blank" rel="noopener noreferrer">Watch Video</a></p>
      )}

      <div className="recipe-actions">
        {canEditRecipe && (
          <Link to={`/edit-recipe/${recipe.id}`} className="edit-link">
            ✏️ Edit
          </Link>
        )}
        {canDeleteRecipe && (
          <button onClick={handleDeleteRecipe} className="delete-recipe" style={{ color: 'red', marginLeft: '10px' }}>
            🗑️ Delete
          </button>
        )}
        <button onClick={handlePrint} className="print-button" style={{ marginLeft: '10px' }}>
          🖨️ Print Recipe
        </button>
      </div>

      <h3>Comments:</h3>
      {recipe.comments?.length > 0 ? (
        <ul>
          {recipe.comments.map((c, index) => (
            <li key={index} className="review-item">
              {c.comment} ⭐ {c.rating}/5
              {isAdmin && (
                <button
                  onClick={() => handleDeleteComment(index)}
                  className="delete-comment"
                  style={{ marginLeft: '10px', color: 'red' }}
                >
                  Delete
                </button>
              )}
            </li>
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
