import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Home() {
  // Array of images for the slider
  const images = [
    '/images/im1.jpeg',
    '/images/im2.jpg',
    '/images/r1.jpg',
    '/images/r2.jpg',
    '/images/r3.jpg',
    '/images/r4.jpg',
    '/images/r5.jpg',
    '/images/r6.jpg',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const token = localStorage.getItem('token');

  // Change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % images.length;
        console.log('Changing to image:', images[newIndex]); // Debug log
        return newIndex;
      });
    }, 5000); // Change image every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="home-page">
      {/* Image Slider */}
      <div className="image-slider">
        <button
          className="slider-button prev"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          ❮
        </button>
        <div className="slider-container">
          <img
            src={images[currentImageIndex]}
            alt={`Slide ${currentImageIndex + 1}`}
            className="slider-image"
            onError={(e) => {
              e.target.src = '/images/fallback-image.jpg';
              console.error(`Failed to load image: ${images[currentImageIndex]}`);
            }}
          />
          <div className="slider-caption">
            Discover delicious recipes from around the world!
          </div>
        </div>
        <button
          className="slider-button next"
          onClick={goToNext}
          aria-label="Next slide"
        >
          ❯
        </button>
        <div className="slider-dots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></span>
          ))}
        </div>
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
        {!token && (
          <div className="auth-links">
            <Link to="/login" className="auth-link">
              Login
            </Link>
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
