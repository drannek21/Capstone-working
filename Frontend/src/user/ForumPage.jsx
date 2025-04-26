import React from 'react';
import ForumRoom from './ForumRoom';
import './ForumPage.css';

const ForumPage = () => {
  return (
    <div className="forum-page-container">
      <div className="forum-page-content">
        <ForumRoom />
      </div>
    </div>
  );
};

export default ForumPage;
