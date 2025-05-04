import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const RecipeList = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filterBy, setFilterBy] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://recipehub-h224.onrender.com';
  const storedUsername = localStorage.getItem('username') || '';
  const isAdmin = storedUsername === 'maryam865';
  console.log('RecipeList - Stored username:', storedUsername); // Debug log
  console.log('RecipeList - isAdmin:', isAdmin); // Debug log

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        console.log('Fetching recipes'); // Debug log
        const response = await axios.get(`${apiUrl}/recipes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('RecipeList - Fetched recipes:', response.data); // Debug log
        setRecipes(response.data);
        setFilteredRecipes(response.data);
      } catch (error) {
        console.error('Fetch recipes error:', error.response || error.message || error); // Debug log
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          navigate('/login');
        } else {
          setError(error.response?.data?.message || 'Error fetching recipes');
        }
      }
    };
    fetchRecipes();
  }, [navigate, location.state?.refresh]);

  useEffect(() => {
    let updatedRecipes = [...recipes];
    const lowerQuery = searchQuery.toLowerCase();

    // Apply search filter
    updatedRecipes = updatedRecipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.cuisine.toLowerCase().includes(lowerQuery)
    );

    // Apply filter
    updatedRecipes = updatedRecipes.filter((recipe) => {
      if (filterBy === 'all') return true;
      if (filterBy === 'cuisine-italian') return recipe.cuisine.toLowerCase() === 'italian';
      if (filterBy === 'cuisine-mexican') return recipe.cuisine.toLowerCase() === 'mexican';
      if (filterBy === 'cuisine-indian') return recipe.cuisine.toLowerCase() === 'indian';
      if (filterBy === 'calories') return recipe.calories < 500;
      if (filterBy === 'my-recipes') return recipe.createdBy === storedUsername;
      if (filterBy === 'with-video') return recipe.youtubeLink && recipe.youtubeLink.trim() !== '';
      return true;
    });

    // Apply sorting
    if (sortBy === 'cookingTime') {
      updatedRecipes.sort((a, b) => a.cookingTime - b.cookingTime);
    } else if (sortBy === 'rating') {
      updatedRecipes.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'date-added') {
      updatedRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredRecipes(updatedRecipes);
  }, [searchQuery, recipes, sortBy, filterBy, storedUsername]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setError('');
  };

  const handleDelete = async (id, recipeName) => {
    if (!id) {
      console.error('Delete aborted: Recipe ID is undefined'); // Debug log
      setError('Cannot delete recipe: Invalid ID');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${recipeName}"?`)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        console.log(`Deleting recipe with ID: ${id}, Name: ${recipeName}`); // Debug log
        const response = await axios.delete(`${apiUrl}/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Delete response:', response.status, response.data); // Debug log
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          navigate('/login');
          return;
        }
        if (response.status === 403) {
          throw new Error('You are not authorized to delete this recipe');
        }
        if (response.status === 404) {
          throw new Error('Recipe not found');
        }
        if (response.status !== 204 && response.status !== 200) {
          throw new Error('Failed to delete recipe');
        }
        console.log(`Recipe "${recipeName}" deleted successfully from MongoDB`); // Debug log
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
        setFilteredRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      } catch (error) {
        console.error('Delete recipe error:', error.response || error.message || error); // Debug log
        setError(error.response?.data?.message || error.message || 'Error deleting recipe');
      }
    }
  };

  return (
    <div className="recipe-list">
      <h1>Recipe List</h1>
      {error && <p className="error">{error}</p>}
      <input
        type="text"
        placeholder="Search recipes by name or cuisine..."
        className="search-bar"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <p className="filter-sort-instructions">Use the options below to filter and sort your recipes.</p>
      <div className="sort-filter-container">
        <div className="filter-controls">
          <label htmlFor="filterBy">Filter by: </label>
          <select
            id="filterBy"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <optgroup label="Cuisine">
              <option value="cuisine-italian">Italian</option>
              <option value="cuisine-mexican">Mexican</option>
              <option value="cuisine-indian">Indian</option>
            </optgroup>
            <option value="calories">Low Calories (&lt; 500)</option>
            <option value="my-recipes">My Recipes</option>
            <option value="with-video">With Video</option>
          </select>
        </div>
        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by: </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="default">Default</option>
            <option value="cookingTime">Cooking Time</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="date-added">Date Added (Newest First)</option>
          </select>
        </div>
      </div>
      <Link to="/add-recipe" className="add-recipe-link">
        + Add a New Recipe
      </Link>
      {filteredRecipes.map((recipe) => {
        const canDelete = isAdmin || storedUsername === recipe.createdBy;
        console.log(`RecipeList - Recipe ${recipe.name}: canDelete=${canDelete}, createdBy=${recipe.createdBy}, username=${storedUsername}, id=${recipe.id}`); // Debug log
        return (
          <div key={recipe.id} className="recipe-item">
            <h3>
              <Link to={`/recipes/${recipe.id}`} className="recipe-link">
                <span className="recipe-name">{recipe.name} ({recipe.cuisine})</span>
                {recipe.imageUrl && (
                  <div className="quick-view">
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
              </Link>
            </h3>
            {canDelete && (
              <button
                className="delete-button"
                onClick={() => handleDelete(recipe.id, recipe.name)}
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecipeList;
