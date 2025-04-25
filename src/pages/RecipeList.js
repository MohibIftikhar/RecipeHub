import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch('https://recipehub-h224.onrender.com/recipes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch recipes');
        const data = await response.json();
        setRecipes(data);
        setFilteredRecipes(data);
      } catch (error) {
        setError(error.message || 'Error fetching recipes');
      }
    };
    fetchRecipes();
  }, [navigate]);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.cuisine.toLowerCase().includes(lowerQuery)
    );
    setFilteredRecipes(filtered);
  }, [searchQuery, recipes]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setError('');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch(`https://recipehub-h224.onrender.com/recipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to delete recipe');
      // Remove the recipe from state
      setRecipes((prev) => prev.filter((recipe) => recipe._id !== id));
      setFilteredRecipes((prev) => prev.filter((recipe) => recipe._id !== id));
    } catch (error) {
      setError(error.message || 'Error deleting recipe');
    }
  };

  return (
    <div className="recipe-list">
      <h1>Recipe List</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Search recipes by name or cuisine..."
        className="search-bar"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <Link to="/add-recipe" className="add-recipe-link">
        + Add a New Recipe
      </Link>
      {filteredRecipes.map((recipe) => (
        <div key={recipe._id} className="recipe-item">
          <h3>
            <Link to={`/recipes/${recipe._id}`} className="recipe-link">
              <span className="recipe-name">{recipe.name} ({recipe.cuisine})</span>
              {recipe.imageUrl && (
                <div className="quick-view">
                  <img
                    src={`http://localhost:5000${recipe.imageUrl}`}
                    alt={recipe.name}
                  />
                </div>
              )}
            </Link>
          </h3>
          <button
            className="delete-button"
            onClick={() => handleDelete(recipe._id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default RecipeList;
