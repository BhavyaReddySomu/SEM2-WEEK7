// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState({ email: '', password: '' });

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/recipes`, {
        headers: { 'x-auth-token': token },
      })
        .then((res) => setRecipes(res.data))
        .catch((err) => console.error(err));
    }
  }, [token]);

  const handleLoginRegister = async () => {
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const res = await axios.post(`${API_URL}/auth${endpoint}`, user);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
    } catch (error) {
      console.error('Error during authentication', error);
    }
  };

  const handleRecipeSubmit = async () => {
    try {
      await axios.post(
        `${API_URL}/recipes`,
        newRecipe,
        { headers: { 'x-auth-token': token } },
      );
      setNewRecipe({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
      });
    } catch (error) {
      console.error('Error posting recipe', error);
    }
  };

  return (
    <div className="App">
      <h1>Recipe Sharing Platform</h1>

      {token ? (
        <div>
          <h2>Create a New Recipe</h2>
          <input
            type="text"
            placeholder="Title"
            value={newRecipe.title}
            onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newRecipe.description}
            onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
          />
          <textarea
            placeholder="Ingredients"
            value={newRecipe.ingredients}
            onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
          />
          <textarea
            placeholder="Instructions"
            value={newRecipe.instructions}
            onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
          />
          <button onClick={handleRecipeSubmit}>Submit Recipe</button>
        </div>
      ) : (
        <div>
          <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
          <button onClick={handleLoginRegister}>
            {authMode === 'login' ? 'Login' : 'Register'}
          </button>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            Switch to {authMode === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      )}

      <h2>Recipes</h2>
      {recipes.map((recipe) => (
        <div key={recipe._id}>
          <h3>{recipe.title}</h3>
          <p>{recipe.description}</p>
          <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
          <p>{recipe.instructions}</p>
        </div>
      ))}
    </div>
  );
};

export default App;
