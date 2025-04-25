import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Home() {
  // Array of images for the slider
  const images = [
    'im1.jpeg', // Local images in public/images/
    'im2.jpg',
    '/images/r1.jpg',
    '/images/r2.jpg',
    '/images/r3.jpg',
    '/images/r4.jpg',
    '/images/r5.jpg',
    '/images/r6.jpg',   
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="home-page">
      {/* Image Slider */}
      <div className="image-slider">
        <img
          src={images[currentImageIndex]}
          alt={`Slide ${currentImageIndex + 1}`}
          className="slider-image"
        />
      </div>

      {/* About Section */}
      <div className="about-section">
        <h2>Welcome to RecipeHub</h2>
        <p>
          RecipeHub is your go-to destination for discovering, sharing, and enjoying delicious recipes from around the world. Whether you’re a seasoned chef or a home cook, our community-driven platform makes it easy to explore new dishes, add your own creations, and connect with fellow food lovers. Join us today and start your culinary journey!
        </p>
        <Link to="/recipes" className="cta-button">
          Explore Recipes
        </Link>
      </div>
    </div>
  );
}

export default Home;