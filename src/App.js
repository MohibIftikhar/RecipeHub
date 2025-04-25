// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import RecipeList from './pages/RecipeList';
import AddRecipe from './pages/AddRecipe';
import EditRecipe from './pages/EditRecipe';
import RecipeDetails from './pages/RecipeDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// ProtectedRoute component to guard authenticated routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const [token, setToken] = useState(null);

  // Clear token on initial load to force /login
  useEffect(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-brand">
            <img src="l22.png" alt="RecipeHub Logo" className="app-logo" />
            <h1>RecipeHub</h1>
          </div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/recipes">Recipe List</Link>
            <Link to="/add-recipe">Add Recipe</Link>
            {token ? (
              <button
                className="logout-button"
                onClick={() => {
                  localStorage.removeItem('token');
                  setToken(null);
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={token ? <Home /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/recipes"
              element={<ProtectedRoute><RecipeList /></ProtectedRoute>}
            />
            <Route
              path="/recipes/:id"
              element={<ProtectedRoute><RecipeDetails /></ProtectedRoute>}
            />
            <Route
              path="/add-recipe"
              element={<ProtectedRoute><AddRecipe /></ProtectedRoute>}
            />
            <Route
              path="/edit-recipe/:id"
              element={<ProtectedRoute><EditRecipe /></ProtectedRoute>}
            />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<Register />} /> {/* Add route for Register */}
            <Route
              path="*"
              element={<Navigate to={token ? "/" : "/login"} replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;