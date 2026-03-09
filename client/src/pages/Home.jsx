// client/src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';
import '../styles/home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/login');
  };

  return (
    <div className="taskhive-hero">
      <QuantumBackground />
      {/* hover-grid removed for premium typography behavior */}

      {/* Title is now a direct child for proper Flexbox flow */}
      <h1 className="taskhive-title">
        {"TASKHIVE".split("").map((letter, index) => (
          <span key={index} className="char">{letter}</span>
        ))}
      </h1>

      <p className="taskhive-tagline">
        Intelligent Multi-Module Environment for Project Management and Collaboration
      </p>

      <button className="get-started-btn" onClick={handleEnter}>
        Get Inside
      </button>
    </div>
  );
};

export default Home;
